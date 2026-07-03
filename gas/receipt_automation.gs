// Google Drive OCR로 영수증을 읽어 개발QA/QE 구분별로 Sheets에 누적·집계하는 영수증 자동화 시스템

// ==========================================
// 1. 필수 설정 항목 (본인의 환경에 맞게 수정)
// ==========================================
const SOURCE_FOLDER_ID = '15QJQr5qY2SpXVADC16OIWH1stFaVJHO7';
const PROCESSED_FOLDER_ID = '1tOCXowJwTlWjh7Okv9JG0FtjdBwG30Vc';

// 구분 값 = 입력/처리 하위폴더 이름과 동일해야 함
const CATEGORIES = ['개발QA', 'QE'];

const SHEET_NAMES = {
  DATA: '데이터관리',
  REPORT: '월별보고서'
};

// 구분별 템플릿 시트 이름 (예: '개발QA_템플릿', 'QE_템플릿')
const TEMPLATE_SHEET_SUFFIX = '_템플릿';

function templateSheetName(category) {
  return category + TEMPLATE_SHEET_SUFFIX;
}

// UI가 없는 트리거 환경에서도 안전하게 알림을 시도한다.
function safeAlert(message) {
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (e) {
    Logger.log(message);
  }
}

// 부모 폴더에서 이름으로 하위폴더를 찾고, 없으면 옵션에 따라 생성한다.
function getSubFolder(parent, name, createIfMissing) {
  const it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return createIfMissing ? parent.createFolder(name) : null;
}

// ==========================================
// 2. 메인 실행 함수: 폴더 감시 및 처리
// ==========================================
// 입력 구조: SOURCE_FOLDER / {N월} / {개발QA|QE} / 영수증
// 처리 구조: PROCESSED_FOLDER / {N월} / {개발QA|QE} / 영수증  (입력의 월 폴더 이름을 그대로 미러링)
function watchFolder() {
  const source = DriveApp.getFolderById(SOURCE_FOLDER_ID);
  const processedRoot = DriveApp.getFolderById(PROCESSED_FOLDER_ID);

  let total = 0;
  const monthFolders = source.getFolders();
  while (monthFolders.hasNext()) {
    const monthFolder = monthFolders.next();
    const monthName = monthFolder.getName(); // 예: '7월'

    CATEGORIES.forEach(category => {
      // 월 폴더 하위의 구분 폴더(개발QA/QE)에서 나온 영수증을 해당 구분으로 판정한다.
      const srcSub = getSubFolder(monthFolder, category, false);
      if (!srcSub) {
        return;
      }

      // 처리완료폴더 / {N월} / {구분} 구조로 이동할 대상 폴더 준비
      const destMonth = getSubFolder(processedRoot, monthName, true);
      const destSub = getSubFolder(destMonth, category, true);
      const files = srcSub.getFiles();

      while (files.hasNext()) {
        const file = files.next();
        const fileId = file.getId();

        // 파일 ID 기준 중복 방어: 이미 처리한 파일이면 건너뛴다.
        if (isAlreadyProcessed(fileId)) {
          continue;
        }

        // 영수증 분석 및 기록 (구분 전달)
        processReceipt(fileId, category);
        file.moveTo(destSub);
        total++;
      }
    });
  }
  safeAlert(total + "건의 영수증 처리가 완료되었습니다.");
}

// ==========================================
// 3. OCR 및 데이터 추출 로직
// ==========================================
function processReceipt(fileId, category) {
  const file = DriveApp.getFileById(fileId);
  const resource = { title: file.getName(), mimeType: file.getMimeType() };
  const options = { ocr: true, ocrLanguage: "ko" };

  // OCR 수행 (Drive API v2 서비스 추가 필수)
  const tempDoc = Drive.Files.insert(resource, file.getBlob(), options);
  const doc = DocumentApp.openById(tempDoc.id);
  const text = doc.getBody().getText();
  DriveApp.getFileById(tempDoc.id).setTrashed(true);

  // 데이터 추출 (정규식)
  const dateMatch = text.match(/(\d{4}[.\/-]\d{1,2}[.\/-]\d{1,2})/) || [""];
  const amountMatch = text.match(/(?:합계|결제금액|총액|판매합계)[\s:]*([\d,]+)/) || text.match(/([\d,]+)(?=\s*원)/) || ["0"];

  const orderDate = dateMatch[0].replace(/[\/.]/g, '-');
  const totalAmount = amountMatch[1] ? amountMatch[1].replace(/,/g, '') : "0";
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const storeName = lines[0] || "알 수 없는 상호";
  let menuContent = lines.length > 1 ? lines[1] : "메뉴 정보 없음";
  if (lines.length > 3) menuContent += " 외";

  // 내용 중복 체크 후 저장
  if (!isDuplicateData(orderDate, storeName, totalAmount)) {
    updateSheets(fileId, orderDate, storeName, menuContent, totalAmount, category);
  }
}

// ==========================================
// 4. 중복 방어 로직
// ==========================================

// 고유 파일 ID를 문자로 바꾸고 공백을 제거하여 100% 일치할 때만 중복으로 판정한다.
function isAlreadyProcessed(fileId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.DATA);
  const values = sheet.getDataRange().getValues();
  return values.some(row => String(row[0]).trim() === String(fileId).trim());
}

// 날짜·상호명·금액을 강제 문자 변환 및 공백 제거 후 비교하여, 셋이 모두 같을 때만 중복으로 판정한다.
function isDuplicateData(date, store, amount) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.DATA);
  const values = sheet.getDataRange().getValues();
  return values.some(row => {
    const isSameDate = String(row[1]).trim() === String(date).trim();
    const isSameStore = String(row[2]).trim() === String(store).trim();
    const isSameAmount = String(row[4]).trim() === String(amount).trim();
    return isSameDate && isSameStore && isSameAmount;
  });
}

// ==========================================
// 5. 데이터 기록 및 구분별 템플릿 업데이트
// ==========================================

// 구분별 템플릿 시트를 찾거나, 없으면 제목행과 함께 새로 만든다.
function getOrCreateTemplateSheet(ss, category) {
  const name = templateSheetName(category);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(["날짜", "상호명", "메뉴", "금액"]);
  }
  return sheet;
}

function updateSheets(fileId, date, store, menu, amount, category) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSheet = ss.getSheetByName(SHEET_NAMES.DATA);

  // 1. 데이터관리 시트 누적 (F열=구분, G열=처리시각)
  dataSheet.appendRow([fileId, date, store, menu, amount, category, new Date()]);

  // 2. 구분별 템플릿 시트 A~D열에 데이터 입력
  const templateSheet = getOrCreateTemplateSheet(ss, category);
  const newRow = templateSheet.getLastRow() + 1;

  // A열(1): 날짜, B열(2): 상호명, C열(3): 메뉴, D열(4): 금액
  templateSheet.getRange(newRow, 1).setValue(date);
  templateSheet.getRange(newRow, 2).setValue(store);
  templateSheet.getRange(newRow, 3).setValue(menu);
  templateSheet.getRange(newRow, 4).setValue(amount);

  // 3. OCR 인식 실패 항목 검사 및 빨간색 음영 처리 (#FFCCCC 는 연한 빨간색)

  // (1) 날짜를 못 찾았을 때
  if (!date || date.trim() === "") {
    templateSheet.getRange(newRow, 1).setBackground("#FFCCCC");
  } else {
    templateSheet.getRange(newRow, 1).setBackground(null);
  }

  // (2) 상호명을 못 찾았을 때
  if (store === "알 수 없는 상호" || !store) {
    templateSheet.getRange(newRow, 2).setBackground("#FFCCCC");
  } else {
    templateSheet.getRange(newRow, 2).setBackground(null);
  }

  // (3) 메뉴를 못 찾았을 때
  if (menu === "메뉴 정보 없음" || !menu) {
    templateSheet.getRange(newRow, 3).setBackground("#FFCCCC");
  } else {
    templateSheet.getRange(newRow, 3).setBackground(null);
  }

  // (4) 금액을 못 찾았을 때 ("0"원으로 인식되었거나 비어있을 때)
  if (amount === "0" || !amount) {
    templateSheet.getRange(newRow, 4).setBackground("#FFCCCC");
  } else {
    templateSheet.getRange(newRow, 4).setBackground(null);
  }
}

// ==========================================
// 6. 월별 보고서 (구분별 집계) 및 메뉴 설정
// ==========================================
function generateMonthlyReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSheet = ss.getSheetByName(SHEET_NAMES.DATA);
  const reportSheet = ss.getSheetByName(SHEET_NAMES.REPORT) || ss.insertSheet(SHEET_NAMES.REPORT);

  const data = dataSheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const reportData = {};
  for (let i = 1; i < data.length; i++) {
    const rawDate = data[i][1];
    const store = data[i][2];
    const amount = parseInt(data[i][4]) || 0;
    const category = data[i][5] || "미분류";
    if (!rawDate) continue;

    const dateObj = new Date(rawDate);
    const monthKey = dateObj.getFullYear() + "-" + (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const key = category + "|" + monthKey;

    if (!reportData[key]) reportData[key] = { category: category, month: monthKey, sum: 0, count: 0, stores: {} };
    reportData[key].sum += amount;
    reportData[key].count += 1;
    reportData[key].stores[store] = (reportData[key].stores[store] || 0) + 1;
  }

  reportSheet.clear();
  reportSheet.appendRow(["구분", "월분류", "총 지출액", "이용 건수", "주요 이용처"]);

  // 구분 → 월 내림차순 정렬
  const sortedKeys = Object.keys(reportData).sort((a, b) => {
    const ra = reportData[a], rb = reportData[b];
    if (ra.category !== rb.category) return ra.category < rb.category ? -1 : 1;
    return rb.month < ra.month ? -1 : (rb.month > ra.month ? 1 : 0);
  });

  sortedKeys.forEach(key => {
    const stats = reportData[key];
    const mainStore = Object.keys(stats.stores).reduce((a, b) => stats.stores[a] > stats.stores[b] ? a : b);
    reportSheet.appendRow([stats.category, stats.month, stats.sum, stats.count, mainStore + " (" + stats.stores[mainStore] + "회)"]);
  });

  // 총 지출액(C열) 서식
  if (reportSheet.getLastRow() > 1) {
    reportSheet.getRange("C2:C" + reportSheet.getLastRow()).setNumberFormat("#,##0원");
  }
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🧾 영수증 관리')
    .addItem('영수증 폴더 스캔', 'watchFolder')
    .addItem('월별 보고서 생성', 'generateMonthlyReport')
    .addToUi();
}
