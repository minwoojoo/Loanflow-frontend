import { useState } from "react";

import Header from "../../components/Header";
import Footer from "../../components/Footer";

import AdminDashboardPage from "./AdminDashboardPage";
import AdminLoanApplicationListPage from "./AdminLoanApplicationListPage";
import AdminLoanApplicationDetailPage from "./AdminLoanApplicationDetailPage";
import AdminProcessingLogsPage from "./AdminProcessingLogsPage";
import AdminProcessingLogDetailPage from "./AdminProcessingLogDetailPage.jsx";
import AdminTermsManagementPage from "./AdminTermsManagementPage";

import "./AdminPage.css";

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

    // 사이드바 메뉴 이동
    const handleMenuChange = (tab) => {
        setActiveTab(tab);
        setSelectedApplicationId(null);
        setSelectedLogId(null);
    };

    // 대시보드로 이동
    const handleGoHome = () => {
        handleMenuChange("dashboard");
    };

    // 현재 선택된 화면 표시
    const renderContent = () => {

        switch (activeTab) {

            case "dashboard":
                return (
                    <AdminDashboardPage
                        accessToken={accessToken}
                    />
                );

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

            case "logs":
                if (selectedLogId !== null) {
                    return (
                        <AdminProcessingLogDetailPage
                            accessToken={accessToken}
                            logId={selectedLogId}
                            onBack={() => setSelectedLogId(null)}
                        />
                    );
                }

                return (
                    <AdminProcessingLogsPage
                        accessToken={accessToken}
                        onSelect={setSelectedLogId}
                    />
                );

            case "terms":
                return (
                    <AdminTermsManagementPage
                        accessToken={accessToken}
                    />
                );

            default:
                return <AdminDashboardPage />;
        }
    };

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
