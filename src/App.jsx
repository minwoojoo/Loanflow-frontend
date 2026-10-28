import { useEffect, useRef, useState } from "react";

import {
    apiFetch,
    refreshAccessToken,
    setAccessToken,
    clearAccessToken,
} from "./api/apiFetch";

import LoginPage from "./pages/login/LoginPage";
import HomePage from "./pages/home/HomePage";
import TermsAgreementPage from "./pages/loan/terms/TermsAgreementPage";
import LoanLimitPage from "./pages/loan/limit/LoanLimitPage";
import LoanApplicationFormPage from "./pages/loan/application/LoanApplicationFormPage";
import LoanApplicationDetailPage from "./pages/loan/application/LoanApplicationDetailPage";
import AdminPage from "./pages/admin/AdminPage.jsx";

import Header from "./components/Header";
import Footer from "./components/Footer";

import "./App.css";

export default function App() {

    // =====================================
    // 1. 인증 상태
    // =====================================

    const [auth, setAuth] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    // 화면 상태
    const [currentPage, setCurrentPage] = useState("home");
    const [homeTab, setHomeTab] = useState("loan");

    // 사용자가 선택한 대출 상품
    const [selectedProduct, setSelectedProduct] = useState(null);

    // 생성된 대출 신청서 ID
    const [applicationId, setApplicationId] = useState(null);

    // 상세 조회할 대출 신청서 ID
    const [selectedApplicationId, setSelectedApplicationId] =
        useState(null);

    // 동의한 약관 목록
    const [agreedTermsIds, setAgreedTermsIds] = useState([]);

    // 신청서 생성 상태
    const [creatingApplication, setCreatingApplication] =
        useState(false);

    const [applicationError, setApplicationError] = useState("");

    // 작성 중 신청서 조회 상태
    const [checkingDraft, setCheckingDraft] = useState(false);
    const [draftError, setDraftError] = useState("");

    // 작성 중인 신청서 임시저장 데이터
    const [draftData, setDraftData] = useState(null);

    // 예상 한도 및 금리
    const [limitResult, setLimitResult] = useState(null);

    // 사용자 입력 정보
    const [limitForm, setLimitForm] = useState(null);

    // 중복 요청 방지
    const creatingRef = useRef(false);
    const checkingRef = useRef(false);


    // =====================================
    // 2. 새로고침 시 로그인 상태 복구
    // =====================================

    useEffect(() => {
        let cancelled = false;

        async function restoreLogin() {
            try {
                const data = await refreshAccessToken();

                if (!cancelled) {
                    setAuth(data);
                }

            } catch (error) {
                // Refresh Token이 없거나 만료되었다면
                // 로그인 화면을 표시
            } finally {
                if (!cancelled) {
                    setAuthLoading(false);
                }
            }
        }

        restoreLogin();

        return () => {
            cancelled = true;
        };
    }, []);


    // =====================================
    // 3. 로그인 처리
    // =====================================

    const handleLogin = (data) => {

        // 공통 API 모듈에 Access Token 저장
        setAccessToken(data.accessToken);

        // React 로그인 상태 갱신
        setAuth(data);

        // 홈 화면으로 이동
        setCurrentPage("home");
        setHomeTab("loan");
    };


    // =====================================
    // 4. 로그아웃 처리
    // =====================================

    const handleLogout = async () => {

        // 다른 요청이 이전 인증 상태를 사용하지 않도록
        // 공통 Access Token 먼저 초기화
        clearAccessToken();

        try {
            // 백엔드 로그아웃 API 호출
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                console.error(
                    "로그아웃 API 실패:",
                    response.status
                );
            }

        } catch (error) {
            console.error("로그아웃 요청 오류:", error);

        } finally {

            // 로그인 상태 초기화
            setAuth(null);

            // 화면 초기화
            setCurrentPage("home");
            setHomeTab("loan");

            // 대출 신청 관련 상태 초기화
            setAgreedTermsIds([]);
            setSelectedProduct(null);
            setApplicationId(null);
            setSelectedApplicationId(null);

            setDraftData(null);
            setLimitResult(null);
            setLimitForm(null);

            // 오류 메시지 초기화
            setApplicationError("");
            setDraftError("");
        }
    };


    // =====================================
    // 5. 대출 상품 신청하기
    // =====================================

    async function handleStartLoan(product) {

        if (checkingRef.current || creatingRef.current) {
            return;
        }

        checkingRef.current = true;
        setCheckingDraft(true);
        setDraftError("");

        try {

            // 작성 중 신청서 조회
            const response = await apiFetch(
                `/api/loan-applications/draft?productId=${product.productId}`,
                {
                    method: "GET",
                },
                auth,
                setAuth
            );

            // 작성 중 신청서가 존재하는 경우
            if (response.ok) {

                const draft = await response.json();

                setSelectedProduct(product);
                setApplicationId(draft.applicationId);
                setDraftData(draft);

                // 작성 중 신청서 이어서 작성
                setCurrentPage("limit");
                return;
            }

            // 작성 중 신청서가 없는 경우
            if (response.status === 404) {

                setSelectedProduct(product);
                setApplicationId(null);
                setAgreedTermsIds([]);
                setApplicationError("");
                setDraftData(null);

                // 약관 동의 페이지로 이동
                setCurrentPage("terms");
                return;
            }

            if (response.status === 401) {
                throw new Error(
                    "로그인이 만료되었습니다. 다시 로그인해주세요."
                );
            }

            throw new Error(
                "작성 중인 대출 신청서를 확인하지 못했습니다."
            );

        } catch (error) {

            setDraftError(error.message);

        } finally {

            checkingRef.current = false;
            setCheckingDraft(false);
        }
    }


    // =====================================
    // 6. 작성 중 신청서 이어서 신청하기
    // =====================================

    async function handleResumeApplication(application) {

        if (checkingRef.current || creatingRef.current) {
            return;
        }

        if (application.statusName !== "작성중") {
            return;
        }

        checkingRef.current = true;
        setCheckingDraft(true);
        setDraftError("");

        try {

            // 작성 중 신청서 조회
            const response = await apiFetch(
                `/api/loan-applications/draft?productId=${application.productId}`,
                {
                    method: "GET",
                },
                auth,
                setAuth
            );

            if (!response.ok) {

                if (response.status === 404) {
                    throw new Error(
                        "작성 중인 신청서를 찾을 수 없습니다."
                    );
                }

                if (response.status === 401) {
                    throw new Error(
                        "로그인이 만료되었습니다. 다시 로그인해주세요."
                    );
                }

                throw new Error(
                    "작성 중인 신청서 조회에 실패했습니다."
                );
            }

            const draft = await response.json();

            // 선택한 신청서와 조회 결과 비교
            if (
                draft.applicationId !==
                application.applicationId
            ) {
                throw new Error(
                    "선택한 신청서와 작성 중인 신청서가 일치하지 않습니다."
                );
            }

            // 신청서 상태 복원
            setApplicationId(draft.applicationId);
            setDraftData(draft);

            // 상품 정보 복원
            setSelectedProduct({
                productId: application.productId,
                productName: application.productName,
                maxLoanTerm: application.maxLoanTerm,
            });

            // 한도 조회 화면으로 이동
            setCurrentPage("limit");

        } catch (error) {

            setDraftError(error.message);
            alert(error.message);

        } finally {

            checkingRef.current = false;
            setCheckingDraft(false);
        }
    }


    // =====================================
    // 7. 신규 신청자 약관 동의 완료
    // =====================================

    async function handleCompleteTerms(selectedIds) {

        if (creatingRef.current) {
            return;
        }

        if (!auth?.accessToken || !selectedProduct) {
            setApplicationError(
                "로그인 정보 또는 대출 상품 정보를 확인해주세요."
            );
            return;
        }

        creatingRef.current = true;
        setCreatingApplication(true);
        setApplicationError("");

        try {

            // 신규 대출 신청서 생성
            const response = await apiFetch(
                "/api/loan-applications",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        productId: selectedProduct.productId,
                        agreedTermsIds: selectedIds,
                    }),
                },
                auth,
                setAuth
            );

            if (!response.ok) {

                if (response.status === 409) {
                    throw new Error(
                        "이미 진행 중인 대출 신청서가 존재합니다. " +
                        "상품 목록에서 다시 신청해주세요."
                    );
                }

                if (response.status === 401) {
                    throw new Error(
                        "로그인이 만료되었습니다. 다시 로그인해주세요."
                    );
                }

                throw new Error(
                    "대출 신청서 생성에 실패했습니다."
                );
            }

            // 생성된 신청서 정보
            const data = await response.json();

            if (data.applicationId == null) {
                throw new Error(
                    "생성된 대출 신청서 ID를 확인할 수 없습니다."
                );
            }

            setApplicationId(data.applicationId);
            setAgreedTermsIds(selectedIds);

            // 한도 조회 페이지로 이동
            setCurrentPage("limit");

        } catch (error) {

            setApplicationError(error.message);

        } finally {

            creatingRef.current = false;
            setCreatingApplication(false);
        }
    }


    // =====================================
    // 8. 로그인 상태 확인 중
    // =====================================

    if (authLoading) {
        return (
            <div className="auth-loading">
                로그인 상태 확인 중...
            </div>
        );
    }


    // =====================================
    // 9. 로그인 화면
    // =====================================

    if (!auth) {
        return <LoginPage onLogin={handleLogin} />;
    }


    // =====================================
    // 10. 관리자 화면
    // =====================================

    if (auth.role === "ADMIN") {
        return (
            <AdminPage
                accessToken={auth.accessToken}
                auth={auth}
                setAuth={setAuth}
                onLogout={handleLogout}
            />
        );
    }


    // =====================================
    // 11. 일반 사용자 화면
    // =====================================

    return (
        <div className="mobile-container">

            <Header
                onGoHome={() => {

                    if (
                        currentPage === "limit" ||
                        currentPage === "applicationForm"
                    ) {
                        const confirmed = window.confirm(
                            "작성 중인 내용이 저장되지 않았을 수 있습니다. " +
                            "홈으로 이동하시겠습니까?"
                        );

                        if (!confirmed) {
                            return;
                        }
                    }

                    setCurrentPage("home");
                    setHomeTab("loan");
                }}
            />


            {/* 홈 화면 */}
            {currentPage === "home" && (
                <>
                    <HomePage
                        accessToken={auth.accessToken}
                        auth={auth}
                        setAuth={setAuth}
                        onLogout={handleLogout}
                        onStartLoan={handleStartLoan}
                        checkingDraft={checkingDraft}
                        draftError={draftError}
                        activeTab={homeTab}
                        onTabChange={setHomeTab}
                        onViewApplication={(id) => {
                            setSelectedApplicationId(id);
                            setCurrentPage("applicationDetail");
                        }}
                    />

                    <Footer />
                </>
            )}


            {/* 약관 동의 화면 */}
            {currentPage === "terms" && (
                <TermsAgreementPage
                    accessToken={auth.accessToken}
                    auth={auth}
                    setAuth={setAuth}
                    selectedProduct={selectedProduct}
                    onBack={() => {

                        if (!creatingRef.current) {
                            setApplicationError("");
                            setCurrentPage("home");
                        }
                    }}
                    onNext={handleCompleteTerms}
                    submitting={creatingApplication}
                    submitError={applicationError}
                />
            )}


            {/* 대출 한도 조회 화면 */}
            {currentPage === "limit" && (
                <LoanLimitPage
                    accessToken={auth.accessToken}
                    auth={auth}
                    setAuth={setAuth}
                    applicationId={applicationId}
                    draftData={draftData}
                    onBack={() => setCurrentPage("home")}
                    onNext={(result, form) => {

                        // 한도 조회 결과 저장
                        setLimitResult(result);

                        // 고객 입력 정보 저장
                        setLimitForm(form);

                        // 대출 조건 입력 화면 이동
                        setCurrentPage("applicationForm");
                    }}
                />
            )}


            {/* 대출 신청서 작성 화면 */}
            {currentPage === "applicationForm" && (
                <LoanApplicationFormPage
                    key={applicationId}
                    accessToken={auth.accessToken}
                    auth={auth}
                    setAuth={setAuth}
                    applicationId={applicationId}
                    limitResult={limitResult}
                    draftData={draftData}
                    maxLoanTerm={selectedProduct?.maxLoanTerm}
                    onBack={() => {
                        setCurrentPage("limit");
                    }}
                    onNext={(result) => {

                        console.log(
                            "대출 조건 입력 완료:",
                            result
                        );

                        // 신청서 상태 초기화
                        setApplicationId(null);
                        setDraftData(null);
                        setLimitResult(null);
                        setSelectedProduct(null);

                        // 신청 내역으로 이동
                        setHomeTab("history");
                        setCurrentPage("home");

                        alert("신청을 완료하였습니다.");
                    }}
                />
            )}


            {/* 대출 신청 상세 조회 화면 */}
            {currentPage === "applicationDetail" && (
                <LoanApplicationDetailPage
                    accessToken={auth.accessToken}
                    auth={auth}
                    setAuth={setAuth}
                    applicationId={selectedApplicationId}
                    onBack={() => {

                        setSelectedApplicationId(null);
                        setHomeTab("history");
                        setCurrentPage("home");
                    }}
                    onResume={handleResumeApplication}
                />
            )}

        </div>
    );
}
