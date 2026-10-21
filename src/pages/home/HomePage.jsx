import { useEffect, useState } from "react";
import "./HomePage.css";

export default function HomePage({
                                     accessToken,
                                     onLogout,
                                     onStartLoan,
                                    checkingDraft = false,
                                    draftError = "",
                                    activeTab,
                                    onTabChange,
                                    onViewApplication,
                                 }) {
    // 대출 상품 목록
    const [loanProducts, setLoanProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productsError, setProductsError] = useState("");

    // 회원 정보
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    // 회원 정보 수정
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    // 대출 신청 내역
    const [loanApplications, setLoanApplications] = useState([]);
    const [applicationsLoading, setApplicationsLoading] = useState(false);
    const [applicationsError, setApplicationsError] = useState("");

    const [form, setForm] = useState({
        name: "",
        employmentType: "",
        annualIncome: "",
        birthDate: "",
    });

    // 대출 신청 탭에서 상품 목록 조회
    useEffect(() => {
        if (activeTab !== "loan") {
            return;
        }

        const controller = new AbortController();

        async function fetchProducts() {
            setProductsLoading(true);
            setProductsError("");

            try {
                const response = await fetch("/api/loan-products", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(
                        response.status === 401
                            ? "로그인이 만료되었습니다. 다시 로그인해주세요."
                            : "대출 상품 목록을 조회하지 못했습니다."
                    );
                }

                const data = await response.json();

                if (!controller.signal.aborted) {
                    setLoanProducts(data);
                }

            } catch (error) {
                if (error.name !== "AbortError") {
                    setProductsError(error.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setProductsLoading(false);
                }
            }
        }

        fetchProducts();

        return () => controller.abort();
    }, [activeTab, accessToken]);

    // 내 정보 탭에서 회원 정보 조회
    useEffect(() => {
        if (activeTab !== "settings") {
            return;
        }

        const controller = new AbortController();

        async function fetchMember() {
            setLoading(true);
            setLoadError("");

            try {
                const response = await fetch("/api/members/me", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(
                        response.status === 401
                            ? "로그인이 만료되었습니다. 다시 로그인해주세요."
                            : "회원 정보를 불러오지 못했습니다."
                    );
                }

                const data = await response.json();

                if (!controller.signal.aborted) {
                    setMember(data);
                }

            } catch (error) {
                if (error.name !== "AbortError") {
                    setLoadError(error.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchMember();

        return () => controller.abort();
    }, [activeTab, accessToken]);


    // 내 대출 신청 목록 조회
    useEffect(() => {
        if (activeTab !== "history" || !accessToken) {
            return;
        }

        const controller = new AbortController();

        async function fetchMyApplications() {
            setApplicationsLoading(true);
            setApplicationsError("");

            try {
                const response = await fetch(
                    "/api/loan-applications",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        response.status === 401
                            ? "로그인이 만료되었습니다. 다시 로그인해 주세요."
                            : "대출 신청 내역을 불러오지 못했습니다."
                    );
                }

                const data = await response.json();

                if (!controller.signal.aborted) {
                    setLoanApplications(data);
                }

            } catch (error) {
                if (!controller.signal.aborted && error.name !== "AbortError") {
                    setApplicationsError(error.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setApplicationsLoading(false);
                }
            }
        }

        fetchMyApplications();

        return () => controller.abort();

    }, [activeTab, accessToken]);


    function formatLoanLimit(amount) {
        if (amount === null || amount === undefined) {
            return "상품 한도 제한 없음";
        }

        return `${Number(amount).toLocaleString("ko-KR")}원`;
    }

    function formatEmployment(value) {
        const types = {
            EMPLOYED: "직장인",
            SELF_EMPLOYED: "자영업자",
            FREELANCER: "프리랜서",
            UNEMPLOYED: "무직",
        };

        return types[value] || value || "미입력";
    }

    function formatIncome(value) {
        if (value === null || value === undefined) {
            return "미입력";
        }

        return `${Number(value).toLocaleString("ko-KR")}원`;
    }

    // 신청 금액 표시
    function formatApplicationAmount(amount) {
        if (amount === null || amount === undefined) {
            return "금액 미입력";
        }

        return `${Number(amount).toLocaleString("ko-KR")}원`;
    }

    // 신청 날짜 표시
    function formatApplicationDate(application) {
        const date =
            application.applicationStatus === "작성중"
                ? application.createdAt
                : application.appliedAt;

        if (!date) {
            return "날짜 정보 없음";
        }

        // LocalDateTime 응답 예: 2026-10-20T14:30:00
        return date.slice(0, 10).replace(/-/g, ".");
    }

    function handleEdit() {
        if (!member) {
            return;
        }

        setForm({
            name: member.name ?? "",
            employmentType: member.employmentType ?? "",
            annualIncome: member.annualIncome ?? "",
            birthDate: member.birthDate ?? "",
        });

        setFormError("");
        setIsEditing(true);
    }

    function handleCancel() {
        setIsEditing(false);
        setFormError("");
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    async function handleSave(event) {
        event.preventDefault();

        if (saving) {
            return;
        }

        if (!form.name.trim()) {
            setFormError("이름은 필수 입력값입니다.");
            return;
        }

        if (
            form.annualIncome !== "" &&
            (
                !Number.isSafeInteger(Number(form.annualIncome)) ||
                Number(form.annualIncome) < 0
            )
        ) {
            setFormError("연 소득은 0 이상의 정수로 입력해주세요.");
            return;
        }

        const requestBody = {
            name: form.name.trim(),
            employmentType: form.employmentType || null,
            annualIncome:
                form.annualIncome === ""
                    ? null
                    : Number(form.annualIncome),
            birthDate: form.birthDate || null,
        };

        setSaving(true);
        setFormError("");

        try {
            const response = await fetch("/api/members/me", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error("회원 정보 수정에 실패했습니다.");
            }

            // DB에 저장된 최신 정보 다시 조회
            const updatedResponse = await fetch("/api/members/me", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!updatedResponse.ok) {
                throw new Error(
                    "정보는 수정되었지만 최신 정보를 불러오지 못했습니다."
                );
            }

            const updatedMember = await updatedResponse.json();

            setMember(updatedMember);
            setIsEditing(false);

        } catch (error) {
            setFormError(error.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="dashboard-layout">

            {/* 사이드바 */}
            <aside className="sidebar">
                <h2 className="sidebar-title">대출 서비스</h2>

                <button
                    type="button"
                    className={activeTab === "loan" ? "active" : ""}
                    onClick={() => onTabChange("loan")}
                >
                    대출 신청
                </button>

                <button
                    type="button"
                    className={activeTab === "history" ? "active" : ""}
                    onClick={() => onTabChange("history")}
                >
                    신청 내역
                </button>

                <button
                    type="button"
                    className={activeTab === "settings" ? "active" : ""}
                    onClick={() => onTabChange("settings")}
                >
                    내 정보
                </button>
            </aside>

            {/* 메인 콘텐츠 */}
            <main className="dashboard-content">

                {/* 대출 상품 목록 */}
                {activeTab === "loan" && (
                    <section className="loan-products-section">

                        <div className="loan-products-heading">
                            <h1>대출 상품 안내</h1>
                            <p>
                                원하는 상품을 선택하고 대출 신청을 진행해 보세요.
                            </p>
                        </div>

                        {productsLoading && (
                            <p className="loan-products-message">
                                대출 상품을 불러오는 중입니다...
                            </p>
                        )}

                        {productsError && (
                            <p className="loan-products-message loan-products-error">
                                {productsError}
                            </p>
                        )}

                        {draftError && (
                            <p className="loan-products-message loan-products-error"
                               role="alert">
                                {draftError}
                            </p>
                        )}

                        {!productsLoading &&
                            !productsError &&
                            loanProducts.length === 0 && (
                                <p className="loan-products-message">
                                    현재 신청 가능한 상품이 없습니다.
                                </p>
                            )}

                        {!productsLoading &&
                            !productsError &&
                            loanProducts.length > 0 && (
                                <div className="loan-products-grid">
                                    {loanProducts.map((product) => (
                                        <article
                                            className="loan-product-card"
                                            key={product.productId}
                                        >
                                            <div className="loan-product-card-top">
                        <span className="loan-product-category">
                          대출 상품
                        </span>
                                                <h2>{product.productName}</h2>
                                            </div>

                                            <div className="loan-product-details">
                                                <div className="loan-product-detail">
                                                    <span>상품 최대 한도</span>
                                                    <strong>
                                                        {formatLoanLimit(product.maxLimit)}
                                                    </strong>
                                                </div>

                                                <div className="loan-product-detail">
                                                    <span>기본 연 금리</span>
                                                    <strong>
                                                        연 {product.baseInterestRate}%
                                                    </strong>
                                                </div>
                                            </div>

                                            <p className="loan-product-description">
                                                실제 예상 한도는 직업 및 연 소득에
                                                따라 달라질 수 있습니다.
                                            </p>

                                            <button
                                                type="button"
                                                className="loan-product-apply-button"
                                                onClick={() => onStartLoan(product)}
                                                disabled={checkingDraft}
                                            >
                                                {checkingDraft ? "신청서 확인 중..." : "대출 신청하기"}
                                            </button>
                                        </article>
                                    ))}
                                </div>
                            )}
                    </section>
                )}



                {/* 대출 신청 내역 */}
                {activeTab === "history" && (
                    <section className="history-section">

                        {/* 신청 내역 헤더 */}
                        <div className="history-heading">
                            <h1>내 신청 목록</h1>
                            <p>대출 신청 내역과 진행 상태를 확인할 수 있습니다.</p>
                        </div>

                        {/* 로딩 */}
                        {applicationsLoading && (
                            <p className="history-message">
                                신청 내역을 불러오는 중입니다...
                            </p>
                        )}

                        {/* 오류 */}
                        {!applicationsLoading && applicationsError && (
                            <p
                                className="history-message history-error"
                                role="alert"
                            >
                                {applicationsError}
                            </p>
                        )}

                        {/* 신청 내역 없음 */}
                        {!applicationsLoading &&
                            !applicationsError &&
                            loanApplications.length === 0 && (
                                <p className="history-message">
                                    아직 대출 신청 내역이 없습니다.
                                </p>
                            )}

                        {/* 신청서 목록 */}
                        {!applicationsLoading &&
                            !applicationsError &&
                            loanApplications.length > 0 && (
                                <div className="history-grid">
                                    {loanApplications.map((application) => (
                                        <article
                                            className="history-card"
                                            key={application.applicationId}
                                        >
                                            {/* 신청서 ID 및 상태 */}
                                            <div className="history-card-top">
                                                <span className="history-application-id">
                                                    신청서 ID: {application.applicationId}
                                                </span>

                                                <span
                                                    className={`history-status ${
                                                        application.applicationStatus === "승인"
                                                            ? "approved"
                                                            : application.applicationStatus === "거절"
                                                                ? "rejected"
                                                                : application.applicationStatus === "심사중"
                                                                    ? "reviewing"
                                                                    : "draft"
                                                    }`}
                                                >
                                                    {application.applicationStatus}
                                                </span>
                                            </div>

                                            {/* 대출 상품명 */}
                                            <h2 className="history-product-name">
                                                {application.productName}
                                            </h2>

                                            {/* 신청 금액 */}
                                            <strong className="history-amount">
                                                {formatApplicationAmount(
                                                    application.applicationAmount
                                                )}
                                            </strong>

                                            {/* 신청 날짜 */}
                                            <div className="history-card-bottom">
                                                <span>
                                                    {application.applicationStatus === "작성중"
                                                        ? "작성 시작일"
                                                        : "신청일"}
                                                </span>

                                                <span>
                                                    {formatApplicationDate(application)}
                                                </span>
                                            </div>

                                            {/* 상세 보기 버튼 */}
                                            <button
                                                type="button"
                                                className="history-detail-button"
                                                onClick={() =>
                                                    onViewApplication(
                                                        application.applicationId
                                                    )
                                                }
                                            >
                                                상세 보기 →
                                            </button>
                                        </article>
                                    ))}
                                </div>
                            )}

                    </section>
                )}

                {/* 내 정보 */}
                {activeTab === "settings" && (
                    <section className="settings-section">
                        <h1>내 정보</h1>
                        <p className="settings-description">
                            회원 정보를 확인하거나 수정할 수 있습니다.
                        </p>

                        {loading && <p>회원 정보를 불러오는 중입니다...</p>}

                        {loadError && (
                            <p className="settings-error">{loadError}</p>
                        )}

                        {!loading && member && (
                            <div className="settings-card">

                                <div className="settings-card-header">
                                    <h2>기본 정보</h2>

                                    {!isEditing && (
                                        <button
                                            type="button"
                                            className="settings-edit-button"
                                            onClick={handleEdit}
                                        >
                                            정보 수정
                                        </button>
                                    )}
                                </div>

                                {!isEditing ? (
                                    <div className="member-info-grid">

                                        <div className="member-info-item">
                                            <span>이름</span>
                                            <strong>{member.name}</strong>
                                        </div>

                                        <div className="member-info-item">
                                            <span>직업</span>
                                            <strong>
                                                {formatEmployment(member.employmentType)}
                                            </strong>
                                        </div>

                                        <div className="member-info-item">
                                            <span>연 소득</span>
                                            <strong>
                                                {formatIncome(member.annualIncome)}
                                            </strong>
                                        </div>

                                        <div className="member-info-item">
                                            <span>생년월일</span>
                                            <strong>
                                                {member.birthDate || "미입력"}
                                            </strong>
                                        </div>

                                    </div>
                                ) : (
                                    <form
                                        className="member-edit-form"
                                        onSubmit={handleSave}
                                    >
                                        <div className="member-form-field">
                                            <label htmlFor="member-name">이름</label>
                                            <input
                                                id="member-name"
                                                name="name"
                                                value={form.name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="member-form-field">
                                            <label htmlFor="member-job">직업</label>
                                            <select
                                                id="member-job"
                                                name="employmentType"
                                                value={form.employmentType}
                                                onChange={handleChange}
                                            >
                                                <option value="">선택하지 않음</option>
                                                <option value="EMPLOYED">직장인</option>
                                                <option value="SELF_EMPLOYED">자영업자</option>
                                                <option value="FREELANCER">프리랜서</option>
                                                <option value="UNEMPLOYED">무직</option>
                                            </select>
                                        </div>

                                        <div className="member-form-field">
                                            <label htmlFor="member-income">
                                                연 소득 (원)
                                            </label>
                                            <input
                                                id="member-income"
                                                name="annualIncome"
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={form.annualIncome}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="member-form-field">
                                            <label htmlFor="member-birth">
                                                생년월일
                                            </label>
                                            <input
                                                id="member-birth"
                                                name="birthDate"
                                                type="date"
                                                max={new Date().toLocaleDateString("en-CA")}
                                                value={form.birthDate}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        {formError && (
                                            <p className="settings-error">
                                                {formError}
                                            </p>
                                        )}

                                        <div className="member-form-actions">
                                            <button
                                                type="button"
                                                className="member-cancel-button"
                                                onClick={handleCancel}
                                                disabled={saving}
                                            >
                                                취소
                                            </button>

                                            <button
                                                type="submit"
                                                className="member-save-button"
                                                disabled={saving}
                                            >
                                                {saving ? "저장 중..." : "저장하기"}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        <div className="settings-card">
                            <h2>계정 관리</h2>
                            <p>현재 계정에서 로그아웃합니다.</p>

                            <button
                                type="button"
                                className="settings-logout-button"
                                onClick={onLogout}
                            >
                                로그아웃
                            </button>
                        </div>
                    </section>
                )}

            </main>
        </div>
    );
}
