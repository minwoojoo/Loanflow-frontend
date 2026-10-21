import { useState, useRef } from "react";
import "./LoanApplicationFormPage.css";

export default function LoanApplicationFormPage({
                                                    accessToken,
                                                    applicationId,
                                                    limitResult,
                                                    draftData,
                                                    maxLoanTerm,
                                                    onBack,
                                                    onNext,
                                                }) {

    // 1. 임시저장된 입력값 복원
    const [applicationAmount, setApplicationAmount] = useState(
        draftData?.applicationAmount != null
            ? String(draftData.applicationAmount) : ""
    );

    const [loanTerm, setLoanTerm] = useState(
        draftData?.loanTerm != null
            ? String(draftData.loanTerm) : ""
    );

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [saveMessage, setSaveMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // 중복 저장 요청 방지
    const savingRef = useRef(false);

    const availableLimit = Number(limitResult?.availableLimit);
    const amountNumber = Number(applicationAmount);
    const termNumber = Number(loanTerm);

    const validAmount =
        applicationAmount !== "" &&
        /^\d+$/.test(applicationAmount) &&
        Number.isSafeInteger(amountNumber) &&
        amountNumber > 0;

    const validTerm =
        loanTerm !== "" &&
        /^\d+$/.test(loanTerm) &&
        Number.isSafeInteger(termNumber) &&
        termNumber > 0;

    // 기본값과 선택 가능한 금액·기간에 대한 화면 검증
    const withinLimit =
        validAmount &&
        limitResult?.eligible === true &&
        Number.isSafeInteger(availableLimit) &&
        amountNumber <= availableLimit;

    const withinMaxTerm =
        validTerm &&
        (
            maxLoanTerm == null ||
            termNumber <= Number(maxLoanTerm)
        );

    const canNext =
        withinLimit &&
        withinMaxTerm &&
        Boolean(accessToken) &&
        applicationId != null &&
        Boolean(onNext);

    const formatMoney = (value) =>
        Number(value).toLocaleString("ko-KR");

    const handleAmountChange = (event) => {
        setApplicationAmount(
            event.target.value.replace(/\D/g, "")
        );
        setError("");
        setSaveMessage("");
    };

    const handleTermChange = (value) => {
        setLoanTerm(value);
        setError("");
        setSaveMessage("");
    };

    // ==========================================
    // 2. 임시저장 공통 함수
    // ==========================================
    const saveDraft = async (moveNext = false) => {

        if (
            savingRef.current ||
            !accessToken ||
            applicationId == null
        ) {
            return;
        }

        // 다음 단계 이동 시에는 필수값 검증
        if (moveNext && !canNext) {
            setError("대출 금액과 기간을 확인해 주세요.");
            return;
        }

        const requestBody = {};

        // 입력된 값만 저장하도록 구성
        if (applicationAmount !== "") {
            if (!validAmount) {
                setError("희망 대출 금액을 확인해 주세요.");
                return;
            }

            requestBody.applicationAmount = amountNumber;
        }

        if (loanTerm !== "") {
            if (!validTerm) {
                setError("희망 대출 기간을 확인해 주세요.");
                return;
            }

            requestBody.loanTerm = termNumber;
        }

        if (Object.keys(requestBody).length === 0) {
            setSaveMessage("임시저장할 정보가 없습니다.");
            return;
        }

        savingRef.current = true;
        setSaving(true);
        setError("");
        setSaveMessage("");

        try {
            const response = await fetch(
                `/api/loan-applications/${applicationId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify(requestBody),
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "로그인이 만료되었습니다. 다시 로그인해 주세요."
                    );
                }

                if (response.status === 404) {
                    throw new Error(
                        "작성 중인 신청서를 찾을 수 없습니다."
                    );
                }

                if (response.status === 400) {
                    throw new Error(
                        "대출 금액 또는 기간을 확인해 주세요."
                    );
                }

                throw new Error("신청서 임시저장에 실패했습니다.");
            }

            const savedData = await response.json();

            if (moveNext) {
                onNext?.({
                    applicationAmount: amountNumber,
                    loanTerm: termNumber,
                });
            } else {
                setSaveMessage("신청 정보가 임시저장되었습니다.");
            }

            return savedData;

        } catch (err) {
            setError(
                err.message || "임시저장 중 오류가 발생했습니다."
            );
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };


    const handleSubmitApplication = async () => {
        if (submitting || saving) {
            return;
        }

        // 기존 프론트엔드 검증 재확인
        if (!withinLimit || !withinMaxTerm) {
            setError("대출 금액과 기간을 다시 확인해 주세요.");
            return;
        }

        setSubmitting(true);
        setError("");
        setSaveMessage("");

        try {
            // 1. 먼저 최신 입력값 임시저장
            // 기존 saveDraft()가 성공 시 true를 반환하도록 되어 있어야 함
            const saved = await saveDraft(false);

            if (!saved) {
                return;
            }

            // 2. 최종 제출 API 호출
            const response = await fetch(
                `/api/loan-applications/${applicationId}/submit`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                let message = "대출 신청 최종 제출에 실패했습니다.";

                try {
                    const errorData = await response.json();
                    message =
                        errorData.message ||
                        errorData.detail ||
                        errorData.error ||
                        message;
                } catch (e) {
                    // 응답 본문이 없는 경우 기본 메시지 사용
                }

                throw new Error(message);
            }

            const result = await response.json();

            // 3. 성공한 경우 App.jsx에 알림
            onNext(result);

        } catch (error) {
            setError(error.message);
        } finally {
            setSubmitting(false);
        }
    };


    const handleSave = () => saveDraft(false);
    const handleNext = () => saveDraft(true);

    return (
        <main className="application-form-page">
            <div className="application-form-container">

                <header className="application-form-header">
                    <button
                        type="button"
                        onClick={onBack}
                        disabled={saving}
                        aria-label="이전 화면"
                    >
                        ‹
                    </button>

                    <strong>신청 정보 입력</strong>
                </header>

                <div className="application-form-progress">
                    <div />
                </div>

                <section className="application-form-content">

                    <p className="application-form-step">
                        대출 조건 입력
                    </p>

                    <h2>대출 조건</h2>

                    <p className="application-form-description">
                        희망하는 대출 금액과 기간을 선택해 주세요.
                    </p>

                    {/* 예상 한도·금리 */}
                    <div className="application-form-limit-info">
                        <span>조회된 예상 한도</span>

                        <strong>
                            {limitResult?.eligible
                                ? `${formatMoney(availableLimit)}원`
                                : "조회 정보 없음"}
                        </strong>

                        <span>
                            예상 금리 연{" "}
                            {limitResult?.estimatedInterestRate ?? "-"}%
                        </span>
                    </div>

                    {/* 희망 대출 금액 */}
                    <div className="application-form-field">
                        <label htmlFor="applicationAmount">
                            희망 대출 금액 *
                        </label>

                        <div className="application-form-money">
                            <input
                                id="applicationAmount"
                                type="text"
                                inputMode="numeric"
                                placeholder="희망 금액 입력"
                                value={
                                    applicationAmount === ""
                                        ? ""
                                        : Number(applicationAmount).toLocaleString("ko-KR")
                                }
                                onChange={handleAmountChange}
                                disabled={saving}
                            />
                            <span>원</span>
                        </div>

                        {limitResult?.eligible && (
                            <small>
                                예상 한도: 최대{" "}
                                {formatMoney(availableLimit)}원
                            </small>
                        )}

                        {applicationAmount !== "" &&
                            !withinLimit && (
                                <p className="application-form-error">
                                    희망 금액은 1원 이상이며
                                    예상 한도를 초과할 수 없습니다.
                                </p>
                            )}
                    </div>

                    {/* 대출 기간 */}
                    <div className="application-form-field">
                        <label>희망 대출 기간 *</label>

                        <div className="application-form-term-buttons">
                            {[12, 24, 36].map((month) => (
                                <button
                                    key={month}
                                    type="button"
                                    disabled={
                                        saving ||
                                        (maxLoanTerm != null &&
                                            month > Number(maxLoanTerm))
                                    }
                                    className={
                                        loanTerm === String(month)
                                            ? "selected"
                                            : ""
                                    }
                                    onClick={() =>
                                        handleTermChange(String(month))
                                    }
                                >
                                    {month}개월
                                </button>
                            ))}
                        </div>

                        <input
                            className="application-form-term-input"
                            type="number"
                            min="1"
                            step="1"
                            placeholder="또는 개월 수 직접 입력"
                            value={loanTerm}
                            onChange={(e) =>
                                handleTermChange(e.target.value)
                            }
                            disabled={saving}
                        />

                        {maxLoanTerm != null && (
                            <small>
                                상품 최대 대출 기간:{" "}
                                {maxLoanTerm}개월
                            </small>
                        )}

                        {loanTerm !== "" && !withinMaxTerm && (
                            <p className="application-form-error">
                                희망 대출 기간을 확인해 주세요.
                            </p>
                        )}
                    </div>

                    {error && (
                        <p className="application-form-error" role="alert">
                            {error}
                        </p>
                    )}

                    {saveMessage && (
                        <p className="application-form-success" role="status">
                            {saveMessage}
                        </p>
                    )}

                    <p className="application-form-description">
                        신청 정보는 임시저장 후 다시 불러올 수 있습니다.
                        실제 대출 조건은 최종 제출 시 검증됩니다.
                    </p>
                </section>

                <footer className="application-form-footer">
                    <button
                        type="button"
                        className="application-form-back"
                        onClick={handleSave}
                        disabled={
                            saving ||
                            submitting ||
                            !accessToken ||
                            applicationId == null
                        }
                    >
                        {saving ? "저장 중..." : "임시저장"}
                    </button>

                    <button
                        type="button"
                        className="application-form-next"
                        onClick={handleSubmitApplication}
                        disabled={
                            !canNext ||
                            saving ||
                            submitting ||
                            !accessToken ||
                            applicationId == null
                        }
                    >
                        {submitting ? "제출 중..." : "최종 제출"}
                    </button>
                </footer>
            </div>
        </main>
    );
}
