import { useEffect, useState } from "react";
import { apiFetch } from "../../../api/apiFetch";
import "./AdminTermsManagementPage.css";

export default function AdminTermsManagementPage({
                                                     accessToken,
                                                    auth,
                                                    setAuth,
                                                     onSelect,
                                                     onCreate
                                                 }) {
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ==========================
    // 1. 전체 약관 목록 조회
    // ==========================
    useEffect(() => {
        const controller = new AbortController();

        async function fetchTerms() {
            setLoading(true);
            setError("");

            try {
                const response = await apiFetch(
                    "/api/admin/terms",
                    {
                        method: "GET",
                        signal: controller.signal
                    },
                    auth,
                    setAuth
                );

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error(
                            "로그인이 만료되었습니다."
                        );
                    }

                    if (response.status === 403) {
                        throw new Error(
                            "운영자 권한이 없습니다."
                        );
                    }

                    throw new Error(
                        "약관 목록을 불러오지 못했습니다."
                    );
                }

                const data = await response.json();

                if (!controller.signal.aborted) {
                    setTerms(data);
                }

            } catch (err) {
                if (
                    err.name !== "AbortError" &&
                    !controller.signal.aborted
                ) {
                    setError(err.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchTerms();

        return () => controller.abort();

    }, [accessToken]);

    // ==========================
    // 2. 필수 약관 여부 표시
    // ==========================
    const getRequiredLabel = (requiredYn) => {
        switch (requiredYn) {
            case "Y":
                return "필수";
            case "N":
                return "선택";
            default:
                return "-";
        }
    };

    // ==========================
    // 3. 활성 상태 표시
    // ==========================
    const getActiveLabel = (isActive) => {
        switch (isActive) {
            case "Y":
                return "활성";
            case "N":
                return "비활성";
            default:
                return "-";
        }
    };

    const getActiveClass = (isActive) => {
        switch (isActive) {
            case "Y":
                return "active";
            case "N":
                return "inactive";
            default:
                return "";
        }
    };

    // ==========================
    // 4. 화면 렌더링
    // ==========================
    return (
        <section className="admin-terms-page">

            <div className="admin-page-heading">
                <h2>약관 관리</h2>
                <p>
                    전체 약관의 등록 현황과 활성 상태를
                    확인합니다.
                </p>
            </div>

            {/* 신규 약관 등록 버튼 */}
            <div className="admin-terms-toolbar">
                <button
                    type="button"
                    className="admin-terms-create-button"
                    onClick={onCreate}
                >
                    + 신규 약관 등록
                </button>
            </div>

            {/* 로딩 */}
            {loading && (
                <p>약관 목록을 불러오는 중입니다.</p>
            )}

            {/* 오류 */}
            {!loading && error && (
                <p className="admin-error">
                    {error}
                </p>
            )}

            {/* 전체 약관 목록 */}
            {!loading && !error && (
                <div className="admin-panel">

                    <div className="admin-list-header">
                        <h3>전체 약관 목록</h3>

                        <span>
                            총 {terms.length}건
                        </span>
                    </div>

                    {terms.length === 0 ? (
                        <p className="admin-empty">
                            등록된 약관이 없습니다.
                        </p>
                    ) : (
                        <div className="admin-table-wrapper">

                            <table className="admin-table">
                                <thead>
                                <tr>
                                    <th>약관 ID</th>
                                    <th>약관명</th>
                                    <th>약관 코드</th>
                                    <th>버전</th>
                                    <th>필수 여부</th>
                                    <th>활성 상태</th>
                                    <th>상세</th>
                                </tr>
                                </thead>

                                <tbody>
                                {terms.map((term) => (
                                    <tr key={term.termsId}>

                                        <td>
                                            {term.termsId}
                                        </td>

                                        <td className="admin-terms-name">
                                            {term.termsName}
                                        </td>

                                        <td>
                                            {term.termsCode}
                                        </td>

                                        <td>
                                            {term.termsVersion}
                                        </td>

                                        <td>
                                                <span
                                                    className={
                                                        `admin-terms-required ${
                                                            term.requiredYn === "Y"
                                                                ? "required"
                                                                : "optional"
                                                        }`
                                                    }
                                                >
                                                    {getRequiredLabel(
                                                        term.requiredYn
                                                    )}
                                                </span>
                                        </td>

                                        <td>
                                                <span
                                                    className={
                                                        `admin-terms-status ${
                                                            getActiveClass(
                                                                term.isActive
                                                            )
                                                        }`
                                                    }
                                                >
                                                    {getActiveLabel(
                                                        term.isActive
                                                    )}
                                                </span>
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className="admin-detail-button"
                                                onClick={() =>
                                                    onSelect(
                                                        term.termsId
                                                    )
                                                }
                                            >
                                                상세 조회
                                            </button>
                                        </td>

                                    </tr>
                                ))}
                                </tbody>
                            </table>

                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
