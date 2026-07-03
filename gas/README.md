# 영수증 자동화 (Google Apps Script)

Google Drive에 업로드한 영수증을 OCR로 읽어 Google Sheets에 누적·집계하는 GAS 스크립트다.
로컬/PowerShell 기반 `corpcard-expense`와는 별개의 클라우드형 파이프라인이다.

## 파일

- `receipt_automation.gs` — 폴더 감시 → OCR 추출 → 시트 기록 → 월별 보고서 생성

## 폴더 구조

구분(개발QA/QE)은 **입력 폴더 경로**로 판정하며, 처리완료 폴더는 입력의 월 폴더 이름을 그대로 미러링한다.

```
[입력]      SOURCE_FOLDER / {N월} / 개발QA / *.jpg
            SOURCE_FOLDER / {N월} / QE    / *.jpg

[처리완료]  PROCESSED_FOLDER / {N월} / 개발QA / 영수증
            PROCESSED_FOLDER / {N월} / QE    / 영수증
```

## 시트

- `데이터관리` — 원본 누적 (A:파일ID, B:날짜, C:상호, D:메뉴, E:금액, F:구분, G:처리시각)
- `개발QA_템플릿` / `QE_템플릿` — 구분별 정산 입력 시트 (A~D열, OCR 실패 항목은 `#FFCCCC` 음영)
- `월별보고서` — 구분·월별 지출 집계

## 설정 / 사용

1. `receipt_automation.gs`의 `SOURCE_FOLDER_ID`, `PROCESSED_FOLDER_ID`를 본인 환경에 맞게 수정
2. Apps Script 편집기에서 **Drive API v2** 고급 서비스 추가 (OCR용)
3. 입력 폴더를 `{N월}/개발QA`, `{N월}/QE` 구조로 정리하고 영수증 업로드
4. 스프레드시트 메뉴 **🧾 영수증 관리 → 영수증 폴더 스캔** 실행
5. 집계는 **월별 보고서 생성** 메뉴로 갱신

시간 기반 트리거로 `watchFolder`를 자동 실행할 수 있으며, UI가 없는 트리거 환경에서는 알림 대신 `Logger`로 기록된다.
