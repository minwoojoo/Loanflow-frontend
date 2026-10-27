import { useState } from "react";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "./AdminPage.css";
import "./AdminCommon.css";

import AdminDashboardPage from "./dashboard/AdminDashboardPage";

import AdminLoanApplicationListPage from "./loanApplication/AdminLoanApplicationListPage";
import AdminLoanApplicationDetailPage from "./loanApplication/AdminLoanApplicationDetailPage";

import AdminProcessingLogsPage from "./processingLog/AdminProcessingLogsPage";
import AdminProcessingLogDetailPage from "./processingLog/AdminProcessingLogDetailPage";

import AdminTermsManagementPage from "./terms/AdminTermsManagementPage";
import AdminTermsDetailPage from "./terms/AdminTermsDetailPage";
import AdminTermsCreatePage from "./terms/AdminTermsCreatePage";


const menus = [
    { id: "dashboard", label: "대시보드", icon: "▦" },
    { id: "applications", label: "대출 신청서 조회", icon: "▤" },
    { id: "logs", label: "심사 처리 로그 조회", icon: "☷" },
    { id: "terms", label: "약관 관리", icon: "☰" }
];

export default function AdminPage({ accessToken, onLogout }) {

    // 로그인 후 기본 화면은 대시보드
    const [activeTab, setActiveTab] = useState("dashboard");

    // 상세 조회할 신청서 ID
    const [selectedApplicationId, setSelectedApplicationId] = useState(null);

    // 상세 조회할 로그 ID
    const [selectedLogId, setSelectedLogId] = useState(null);

    // list: 목록, detail: 상세, create: 신규 등록
    const [termsView, setTermsView] = useState("list");

    // 상세 조회할 약관 ID
    const [selectedTermsId, setSelectedTermsId] = useState(null);


    // ==========================
    // 1. 사이드바 메뉴 이동
    // ==========================
    const handleMenuChange = (tab) => {
        setActiveTab(tab);

        setSelectedApplicationId(null);
        setSelectedLogId(null);

        // [추가] 약관 화면 상태 초기화
        setTermsView("list");
        setSelectedTermsId(null);
    };


    // ==========================
    // 2. 대시보드로 이동
    // ==========================
    const handleGoHome = () => {
        handleMenuChange("dashboard");
    };


    // ==========================
    // 3. 현재 선택된 화면 표시
    // ==========================
    const renderContent = () => {

        switch (activeTab) {

            // 대시보드
            case "dashboard":
                return (
                    <AdminDashboardPage
                        accessToken={accessToken}
                    />
                );


            // 대출 신청서 조회
            case "applications":
                if (selectedApplicationId !== null) {
                    return (
                        <AdminLoanApplicationDetailPage
                            accessToken={accessToken}
                            applicationId={selectedApplicationId}
                            onBack={() =>
                                setSelectedApplicationId(null)
                            }
                        />
                    );
                }

                return (
                    <AdminLoanApplicationListPage
                        accessToken={accessToken}
                        onSelect={setSelectedApplicationId}
                    />
                );


            // 심사 처리 로그 조회
            case "logs":
                if (selectedLogId !== null) {
                    return (
                        <AdminProcessingLogDetailPage
                            accessToken={accessToken}
                            logId={selectedLogId}
                            onBack={() =>
                                setSelectedLogId(null)
                            }
                        />
                    );
                }

                return (
                    <AdminProcessingLogsPage
                        accessToken={accessToken}
                        onSelect={setSelectedLogId}
                    />
                );


            // ==========================
            // [수정] 약관 관리
            // ==========================
            case "terms":

                // 1. 약관 상세 조회 화면
                if (termsView === "detail") {
                    return (
                        <AdminTermsDetailPage
                            accessToken={accessToken}
                            termsId={selectedTermsId}
                            onBack={() => {
                                setSelectedTermsId(null);
                                setTermsView("list");
                            }}
                        />
                    );
                }

                // 2. 신규 약관 등록 화면
                if (termsView === "create") {
                    return (
                        <AdminTermsCreatePage
                            accessToken={accessToken}
                            onBack={() => {
                                setSelectedTermsId(null);
                                setTermsView("list");
                            }}
                        />
                    );
                }

                // 3. 전체 약관 목록 화면
                return (
                    <AdminTermsManagementPage
                        accessToken={accessToken}
                        onSelect={(termsId) => {
                            setSelectedTermsId(termsId);
                            setTermsView("detail");
                        }}
                        onCreate={() => {
                            setSelectedTermsId(null);
                            setTermsView("create");
                        }}
                    />
                );


            // 기본 화면
            default:
                return (
                    <AdminDashboardPage
                        accessToken={accessToken}
                    />
                );
        }
    };


    // ==========================
    // 4. 화면 렌더링
    // ==========================
    return (
        <div className="admin-layout">

            {/* 공통 Header */}
            <Header onGoHome={handleGoHome} />

            <div className="admin-body">

                {/* 운영자 사이드바 */}
                <aside className="admin-sidebar">

                    <div className="admin-sidebar-title">
                        운영자 메뉴
                    </div>

                    <nav className="admin-menu">
                        {menus.map((menu) => (
                            <button
                                key={menu.id}
                                type="button"
                                className={
                                    activeTab === menu.id
                                        ? "admin-menu-item active"
                                        : "admin-menu-item"
                                }
                                onClick={() =>
                                    handleMenuChange(menu.id)
                                }
                            >
                                <span className="admin-menu-icon">
                                    {menu.icon}
                                </span>

                                <span>{menu.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="admin-sidebar-bottom">
                        <button
                            type="button"
                            className="admin-logout-button"
                            onClick={onLogout}
                        >
                            로그아웃
                        </button>
                    </div>

                </aside>

                {/* 선택한 운영자 화면 */}
                <main className="admin-main">
                    {renderContent()}
                </main>

            </div>

            {/* 공통 Footer */}
            <Footer />

        </div>
    );
}
