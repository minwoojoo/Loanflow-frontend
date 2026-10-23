import { useRef, useState } from "react";

import LoginPage from "./pages/login/LoginPage";
import HomePage from "./pages/home/HomePage";
import TermsAgreementPage from "./pages/loan/TermsAgreementPage";
import LoanLimitPage from "./pages/loan/LoanLimitPage";
import LoanApplicationFormPage from "./pages/loan/LoanApplicationFormPage";
import LoanApplicationDetailPage from "./pages/loan/LoanApplicationDetailPage";
import AdminPage from "./pages/admin/AdminPage.jsx";

import Header from "./components/Header";
import Footer from "./components/Footer";

import "./App.css";

export default function App() {
    const [auth, setAuth] = useState(null);
    const [currentPage, setCurrentPage] = useState("home");
    const [homeTab, setHomeTab] = useState("loan");

    // 사용자가 선택한 대출 상품
    const [selectedProduct, setSelectedProduct] = useState(null);

    // 생성된 대출 신청서 ID
    const [applicationId, setApplicationId] = useState(null);

    // 상세 조회할 대출 신청서 ID
    const [selectedApplicationId, setSelectedApplicationId] = useState(null);

    // 동의한 약관 목록
    const [agreedTermsIds, setAgreedTermsIds] = useState([]);

    // 신청서 생성 상태
    const [creatingApplication, setCreatingApplication] = useState(false);
    const [applicationError, setApplicationError] = useState("");

    // 작성 중 신청서 조회 상태
    const [checkingDraft, setCheckingDraft] = useState(false);
    const [draftError, setDraftError] = useState("");

    // 작성 중인 대출 신청서의 임시저장 데이터
    const [draftData, setDraftData] = useState(null);

    // 예상 한도와 금리
    const [limitResult, setLimitResult] = useState(null);

    // 사용자가 입력한 연 소득, 직업 유형, 생년월일
    const [limitForm, setLimitForm] = useState(null);


    // 중복 요청 방지
    const creatingRef = useRef(false);
    const checkingRef = useRef(false);


    const handleLogin = (data) => {
        setAuth(data);
        setCurrentPage("home");
    };

    const handleLogout = () => {
        setAuth(null);
        setCurrentPage("home");
        setHomeTab("loan");

        setAgreedTermsIds([]);
        setSelectedProduct(null);
        setApplicationId(null);
        setSelectedApplicationId(null);

        setDraftData(null);
        setLimitResult(null);
        setLimitForm(null);

        setApplicationError("");
        setDraftError("");
    };

    // =====================================
    // 대출 상품 신청하기 버튼 클릭
    // =====================================
    async function handleStartLoan(product) {

        if (checkingRef.current || creatingRef.current) {
            return;
        }

        checkingRef.current = true;
        setCheckingDraft(true);
        setDraftError("");

        try {
            // 1-1. 기존 작성 중 신청서 조회
            const response = await fetch(
                `/api/loan-applications/draft?productId=${product.productId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${auth.accessToken}`
                    }
                }
            );

            // 1-2. 기존 작성 중 신청서가 존재하는 경우
            if (response.ok) {

                const draft = await response.json();

                setSelectedProduct(product);
                setApplicationId(draft.applicationId);

                setDraftData(draft);

                // 기존 신청서 이어서 작성
                setCurrentPage("limit");
                return;
            }

            // 1-3. 기존 신청서가 없는 경우
            if (response.status === 404) {

                setSelectedProduct(product);
                setApplicationId(null);
                setAgreedTermsIds([]);
                setApplicationError("");
                setDraftData(null);

                // 신규 신청자는 약관 동의 페이지로 이동
                setCurrentPage("terms");
                return;
            }

            // 1-4. 그 외 오류
            if (response.status === 401) {
                throw new Error("로그인이 만료되었습니다. 다시 로그인해주세요.");
            }

            throw new Error("작성 중인 대출 신청서를 확인하지 못했습니다.");

        } catch (error) {
            setDraftError(error.message);

        } finally {
            checkingRef.current = false;
            setCheckingDraft(false);
        }
    }




    // =====================================
    // 작성 중 신청서 이어서 신청하기
    // =====================================
    async function handleResumeApplication(application) {

        if (checkingRef.current || creatingRef.current) {
            return;
        }

        if (application.applicationStatus !== "작성중") {
            return;
        }

        checkingRef.current = true;
        setCheckingDraft(true);
        setDraftError("");

        try {
            // 1. 작성 중 신청서 조회
            const response = await fetch(
                `/api/loan-applications/draft?productId=${application.productId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${auth.accessToken}`,
                    },
                }
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

            // 2. 선택한 신청서와 조회한 신청서가 동일한지 확인
            if (draft.applicationId !== application.applicationId) {
                throw new Error(
                    "선택한 신청서와 작성 중인 신청서가 일치하지 않습니다."
                );
            }

            // 3. 신청서 정보 복원
            setApplicationId(draft.applicationId);
            setDraftData(draft);

            // 4. 상품 정보 설정
            setSelectedProduct({
                productId: application.productId,
                productName: application.productName,
                maxLoanTerm: application.maxLoanTerm,
            });

            // 5. 기존 대출 신청 화면으로 이동
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
    // 신규 신청자 약관 동의 완료
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
            // 2-1. 신규 대출 신청서 생성
            const response = await fetch(
                "/api/loan-applications",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${auth.accessToken}`
                    },
                    body: JSON.stringify({
                        productId: selectedProduct.productId,
                        agreedTermsIds: selectedIds
                    })
                }
            );

            // 2-2. 생성 실패 처리
            if (!response.ok) {

                if (response.status === 409) {
                    throw new Error(
                        "이미 진행 중인 대출 신청서가 존재합니다. 상품 목록에서 다시 신청해주세요."
                    );
                }

                if (response.status === 401) {
                    throw new Error(
                        "로그인이 만료되었습니다. 다시 로그인해주세요."
                    );
                }

                throw new Error("대출 신청서 생성에 실패했습니다.");
            }

            // 2-3. 생성된 신청서 정보
            const data = await response.json();

            if (data.applicationId == null) {
                throw new Error(
                    "생성된 대출 신청서 ID를 확인할 수 없습니다."
                );
            }

            setApplicationId(data.applicationId);
            setAgreedTermsIds(selectedIds);

            // 2-4. 한도 조회 페이지 이동
            setCurrentPage("limit");

        } catch (error) {
            setApplicationError(error.message);

        } finally {
            creatingRef.current = false;
            setCreatingApplication(false);
        }
    }

    // 로그인 전에는 로그인 화면만 표시
    if (!auth) {
        return <LoginPage onLogin={handleLogin} />;
    }

    // 운영자 로그인 시 운영자 전용 화면 표시
    if (auth.role === "ADMIN"){
        return (
            <AdminPage
                accessToken={auth.accessToken}
                onLogout={handleLogout}
            />
        )
    }


    return (
        <div className="mobile-container">

            <Header
                onGoHome={() => {
                    if (
                        currentPage === "limit" ||
                        currentPage === "applicationForm"
                    ) {
                        const confirmed = window.confirm(
                            "작성 중인 내용이 저장되지 않았을 수 있습니다. 홈으로 이동하시겠습니까?"
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


            {currentPage === "applicationForm" && (
                <LoanApplicationFormPage
                    key={applicationId}
                    accessToken={auth.accessToken}
                    applicationId={applicationId}
                    limitResult={limitResult}
                    draftData={draftData}
                    maxLoanTerm={selectedProduct?.maxLoanTerm}

                    onBack={() => {
                        setCurrentPage("limit");
                    }}

                    onNext={(result) => {
                        console.log("대출 조건 입력 완료:", result);

                        // 신청서 작성 상태 초기화
                        setApplicationId(null);
                        setDraftData(null);
                        setLimitResult(null);
                        setSelectedProduct(null);

                        // 내 신청 목록으로 이동
                        setHomeTab("history");
                        setCurrentPage("home");

                        // 성공 메시지
                        alert("신청을 완료하였습니다.");
                    }}
                />
            )}

            {/* 대출 신청 상세 조회 화면 */}
            {currentPage === "applicationDetail" && (
                <LoanApplicationDetailPage
                    accessToken={auth.accessToken}
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
