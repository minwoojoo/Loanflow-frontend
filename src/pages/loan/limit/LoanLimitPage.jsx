import { useEffect, useState } from "react";
import { apiFetch } from "../../../api/apiFetch";
import "./LoanLimitPage.css";

const EMPLOYMENT_TYPES = [
    { value: "EMPLOYED", label: "직장인" },
    { value: "SELF_EMPLOYED", label: "자영업자" },
    { value: "FREELANCER", label: "프리랜서" },
    { value: "UNEMPLOYED", label: "무직" },
];

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export default function LoanLimitPage({
                                          accessToken,
                                        auth,
                                        setAuth,
                                          applicationId,
                                          draftData,
                                          onBack,
                                          onNext,
                                      }) {

    // 1. 고객 입력 정보
    const [annualIncome, setAnnualIncome] = useState("");
    const [employmentType, setEmploymentType] = useState("");
    const [birthDate, setBirthDate] = useState("");

    // 2. 한도 조회 상태
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    // 3. 임시저장 상태
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    // 3-1. 내 정보 불러오기 상태
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState("");

    // 4. 기존 작성 중 신청서 정보 복원
    useEffect(() => {

        setAnnualIncome(
            draftData?.annualIncome != null
                ? String(draftData.annualIncome)
                : ""
        );

        setEmploymentType(
            draftData?.employmentType ?? ""
        );

        setBirthDate(
            draftData?.birthDate ?? ""
        );

        setResult(null);
        setError("");
        setSaveMessage("");

    }, [applicationId, draftData]);

    const today = getToday();

    const incomeNumber = Number(annualIncome);

    // 5. 연 소득 유효성 검사
    const validIncome =
        annualIncome !== "" &&
        /^\d+$/.test(annualIncome) &&
        Number.isSafeInteger(incomeNumber) &&
        incomeNumber >= 0;

    // 6. 생년월일 유효성 검사
    const validBirthDate =
        /^\d{4}-\d{2}-\d{2}$/.test(birthDate) &&
        !Number.isNaN(Date.parse(birthDate)) &&
        birthDate < today;

    // 7. 한도 조회 가능 여부
    const canCheck =
        validIncome &&
        employmentType !== "" &&
        validBirthDate &&
        applicationId != null &&
        Boolean(accessToken);

    // 8. 입력 정보 변경 시 기존 조회 결과 초기화
    const clearResult = () => {
        setResult(null);
        setError("");
        setSaveMessage("");
    };

    const handleIncomeChange = (event) => {

        const value = event.target.value.replace(/\D/g, "");

        setAnnualIncome(value);
        clearResult();
    };

    const handleEmploymentChange = (event) => {

        setEmploymentType(event.target.value);
        clearResult();
    };

    const handleBirthDateChange = (event) => {

        setBirthDate(event.target.value);
        clearResult();
    };



    // ==========================================
    // 내 정보 불러오기 API
    // ==========================================
    const handleLoadMyProfile = async () => {

        if (profileLoading || loading || saving || !accessToken) {
            return;
        }

        setProfileLoading(true);
        setProfileError("");

        try {
            // 1. 로그인한 회원 정보 조회
            const response = await apiFetch(
                "/api/members/me",
                {
                    method: "GET",
                },
                auth,
                setAuth
            );

            // 2. 오류 처리
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "로그인이 만료되었습니다. 다시 로그인해 주세요."
                    );
                }

                throw new Error(
                    "회원 정보를 불러오지 못했습니다."
                );
            }

            // 3. 회원 정보 가져오기
            const member = await response.json();

            // 4. 회원 정보가 존재하는 항목만 입력창에 반영
            if (member.annualIncome != null) {
                setAnnualIncome(String(member.annualIncome));
            }

            if (member.employmentType != null) {
                setEmploymentType(member.employmentType);
            }

            if (member.birthDate != null) {
                setBirthDate(member.birthDate);
            }

            // 5. 기존 한도 조회 결과 초기화
            clearResult();

        } catch (err) {
            setProfileError(
                err.message || "회원 정보 조회 중 오류가 발생했습니다."
            );

        } finally {
            setProfileLoading(false);
        }
    };




    // ==========================================
    // 9. 예상 한도 및 금리 조회 API
    // ==========================================
    const handleCheckLimit = async () => {

        if (!canCheck || loading || saving || profileLoading) {
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {

            const response = await apiFetch(
                "/api/loan-limits/check",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        applicationId: Number(applicationId),
                        annualIncome: incomeNumber,
                        employmentType,
                        birthDate,
                    }),
                },
                auth,
                setAuth
            );

            if (!response.ok) {

                if (response.status === 401) {
                    throw new Error(
                        "로그인이 만료되었습니다. 다시 로그인해 주세요."
                    );
                }

                if (response.status === 404) {
                    throw new Error(
                        "작성 중인 대출 신청서를 찾을 수 없습니다."
                    );
                }

                if (response.status === 400) {
                    throw new Error(
                        "입력 정보 또는 신청 조건을 확인해 주세요."
                    );
                }

                throw new Error(
                    "한도 조회 중 오류가 발생했습니다."
                );
            }

            const data = await response.json();

            setResult(data);

        } catch (err) {

            setError(
                err.message || "서버 연결에 실패했습니다."
            );

        } finally {

            setLoading(false);
        }
    };

    // ==========================================
    // 10. 대출 신청서 임시저장 API
    // ==========================================
    const handleSaveDraft = async () => {

        if (
            saving ||
            loading ||
            profileLoading ||
            applicationId == null ||
            !accessToken
        ) {
            return false;
        }

        setSaving(true);
        setError("");
        setSaveMessage("");

        try {

            // 10-1. 입력된 정보만 저장 요청에 포함
            const requestBody = {};

            if (annualIncome !== "") {

                if (!validIncome) {
                    throw new Error(
                        "연 소득을 올바르게 입력해 주세요."
                    );
                }

                requestBody.annualIncome = incomeNumber;
            }

            if (employmentType !== "") {
                requestBody.employmentType = employmentType;
            }

            if (birthDate !== "") {

                if (!validBirthDate) {
                    throw new Error(
                        "생년월일을 올바르게 입력해 주세요."
                    );
                }

                requestBody.birthDate = birthDate;
            }

            // 10-2. 저장할 데이터가 없는 경우
            if (Object.keys(requestBody).length === 0) {

                setSaveMessage(
                    "임시저장할 입력 정보가 없습니다."
                );

                return false;
            }

            // 10-3. 임시저장 API 호출
            const response = await apiFetch(
                `/api/loan-applications/${applicationId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestBody),
                },
                auth,
                setAuth
            );

            // 10-4. 오류 처리
            if (!response.ok) {

                if (response.status === 401) {
                    throw new Error(
                        "로그인이 만료되었습니다. 다시 로그인해 주세요."
                    );
                }

                if (response.status === 404) {
                    throw new Error(
                        "작성 중인 대출 신청서를 찾을 수 없습니다."
                    );
                }

                if (response.status === 400) {
                    throw new Error(
                        "입력값을 확인해 주세요."
                    );
                }

                throw new Error(
                    "임시저장에 실패했습니다."
                );
            }

            // 10-5. 저장 성공
            setSaveMessage(
                "입력한 정보가 임시저장되었습니다."
            );

            return true;

        } catch (err) {

            setError(
                err.message || "임시저장 중 오류가 발생했습니다."
            );

            return false;

        } finally {

            setSaving(false);
        }
    };

    // ==========================================
    // 11. 다음 화면 이동
    // ==========================================
    const handleNext = async () => {

        // 1. 한도 조회에 성공했는지 확인
        if (!result?.eligible || loading || saving || profileLoading) {
            return;
        }

        // 2. 현재 입력 정보를 자동 임시저장
        const saveSuccess = await handleSaveDraft();

        // 3. 저장 실패 시 다음 화면 이동 차단
        if (!saveSuccess){
            return;
        }

        // 4. 저장 성공 시 다음 화면 이동
        onNext?.(result, {
            annualIncome: incomeNumber,
            employmentType,
            birthDate,
        });
    };

    const formatMoney = (value) =>
        Number(value).toLocaleString("ko-KR");

    return (
        <main className="loan-limit-page">
            <div className="loan-limit-container">

                {/* 상단 헤더 */}
                <header className="loan-limit-header">
                    <button
                        type="button"
                        className="loan-limit-back"
                        onClick={onBack}
                        aria-label="뒤로 가기"
                    >
                        ‹
                    </button>

                    <strong>한도 조회</strong>
                </header>

                <section className="loan-limit-content">

                    {/* 연 소득 */}
                    <div className="loan-limit-field">
                        <label htmlFor="annualIncome">
                            연 소득
                        </label>

                        <div className="loan-limit-money">
                            <input
                                id="annualIncome"
                                type="text"
                                inputMode="numeric"
                                placeholder="연 소득을 입력해 주세요"
                                value={
                                    annualIncome === ""
                                        ? ""
                                        : Number(annualIncome).toLocaleString("ko-KR")
                                }
                                onChange={handleIncomeChange}
                            />

                            <span>원</span>
                        </div>
                    </div>

                    {/* 직업 구분 */}
                    <div className="loan-limit-field">
                        <label htmlFor="employmentType">
                            직업 구분
                        </label>

                        <select
                            id="employmentType"
                            value={employmentType}
                            onChange={handleEmploymentChange}
                        >
                            <option value="">
                                직업을 선택해 주세요
                            </option>

                            {EMPLOYMENT_TYPES.map((type) => (
                                <option
                                    key={type.value}
                                    value={type.value}
                                >
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 생년월일 */}
                    <div className="loan-limit-field">
                        <label htmlFor="birthDate">
                            생년월일
                        </label>

                        <input
                            id="birthDate"
                            type="date"
                            max={today}
                            value={birthDate}
                            onChange={handleBirthDateChange}
                        />
                    </div>

                    {/* 내 정보 불러오기 + 한도 조회 버튼 */}
                    <div className="loan-limit-button-group">

                        {/* 내 정보 불러오기 */}
                        <button
                            type="button"
                            className="loan-limit-profile-button"
                            onClick={handleLoadMyProfile}
                            disabled={
                                profileLoading ||
                                loading ||
                                saving ||
                                !accessToken
                            }
                        >
                            {profileLoading
                                ? "불러오는 중..."
                                : "내 정보 불러오기"}
                        </button>


                        {/* 한도 조회하기 */}
                        <button
                            type="button"
                            className="loan-limit-check-button"
                            onClick={handleCheckLimit}
                            disabled={
                                !canCheck ||
                                loading ||
                                saving ||
                                profileLoading
                            }
                        >
                            {loading
                                ? "조회 중..."
                                : "한도 조회하기"}
                        </button>

                    </div>

                    {/* 회원 정보 조회 오류 */}
                    {profileError && (
                        <p
                            className="loan-limit-profile-error"
                            role="alert"
                        >
                            {profileError}
                        </p>
                    )}


                    {/* 조회 결과 */}
                    <div
                        className="loan-limit-result"
                        aria-live="polite"
                    >
                        {result?.eligible ? (
                            <>
                                <p className="loan-limit-result-label">
                                    조회 결과
                                </p>

                                <strong>
                                    최대{" "}
                                    {formatMoney(result.availableLimit)}
                                    원
                                </strong>

                                <p>
                                    예상 금리 연{" "}
                                    {result.estimatedInterestRate}%
                                </p>
                            </>
                        ) : result && !result.eligible ? (
                            <>
                                <p className="loan-limit-result-label">
                                    조회 결과
                                </p>

                                <strong>
                                    신청 조건 미충족
                                </strong>

                                <p>
                                    {result.ineligibleReason ||
                                        "해당 상품의 신청 조건을 충족하지 않습니다."}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="loan-limit-result-label">
                                    조회 결과
                                </p>

                                <strong>최대 -- 원</strong>

                                <p>예상 금리 -- %</p>
                            </>
                        )}
                    </div>

                    {/* 오류 메시지 */}
                    {error && (
                        <p
                            className="loan-limit-error"
                            role="alert"
                        >
                            {error}
                        </p>
                    )}

                    {/* 임시저장 성공 메시지 */}
                    {saveMessage && (
                        <p
                            className="loan-limit-save-message"
                            role="status"
                        >
                            {saveMessage}
                        </p>
                    )}

                    <p className="loan-limit-notice">
                        조회 결과는 예상 금액이며,
                        실제 심사 결과와 다를 수 있습니다.
                    </p>

                </section>

                {/* 하단 버튼 */}
                <footer className="loan-limit-footer">

                    {/* 임시저장 버튼 */}
                    <button
                        type="button"
                        className="loan-limit-save-button"
                        onClick={handleSaveDraft}
                        disabled={
                            saving ||
                            loading ||
                            profileLoading ||
                            applicationId == null ||
                            !accessToken
                        }
                    >
                        {saving ? "저장 중..." : "임시저장"}
                    </button>

                    {/* 다음 단계 버튼 */}
                    <button
                        type="button"
                        className="loan-limit-next-button"
                        onClick={handleNext}
                        disabled={
                            !result?.eligible ||
                            loading ||
                            saving ||
                            profileLoading ||
                            !onNext
                        }
                    >
                        이 조건으로 신청하기
                    </button>

                </footer>
            </div>
        </main>
    );
}
