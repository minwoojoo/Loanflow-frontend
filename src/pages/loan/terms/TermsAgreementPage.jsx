import { useEffect, useState } from "react";
import "./TermsAgreementPage.css";

export default function TermsAgreementPage({
                                               accessToken,
                                               selectedProduct,
                                               onNext,
                                               onBack,
                                               submitting = false,
                                               submitError = "",
                                           }) {
    const [terms, setTerms] = useState([]);
    const [checkedTerms, setCheckedTerms] = useState({});

    const [selectedTermId, setSelectedTermId] = useState(null);
    const [termContent, setTermContent] = useState("");

    const [loading, setLoading] = useState(true);
    const [contentLoading, setContentLoading] = useState(false);
    const [error, setError] = useState("");

    // 약관 목록 조회
    useEffect(() => {
        const controller = new AbortController();

        async function fetchTerms() {
            setLoading(true);
            setError("");

            try {
                const response = await fetch("/api/terms", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error("약관 목록을 불러오지 못했습니다.");
                }

                const data = await response.json();

                if (!controller.signal.aborted) {
                    setTerms(data);
                    setCheckedTerms({});
                }

            } catch (err) {
                if (err.name !== "AbortError") {
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

    // 약관 상세 내용 조회
    useEffect(() => {
        if (selectedTermId === null) {
            return;
        }

        const controller = new AbortController();

        async function fetchTermDetail() {
            setContentLoading(true);
            setTermContent("");

            try {
                const response = await fetch(
                    `/api/terms/${selectedTermId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error("약관 내용을 불러오지 못했습니다.");
                }

                const data = await response.json();

                if (!controller.signal.aborted) {
                    setTermContent(data.content || "");
                }

            } catch (err) {
                if (err.name !== "AbortError") {
                    setTermContent(err.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setContentLoading(false);
                }
            }
        }

        fetchTermDetail();

        return () => controller.abort();
    }, [selectedTermId, accessToken]);

    function handleCheck(termsId, checked) {
        if (submitting) {
            return;
        }

        setCheckedTerms((previous) => ({
            ...previous,
            [termsId]: checked,
        }));
    }

    function handleCheckAll(event) {
        if(submitting){
            return;
        }

        const checked = event.target.checked;
        const next = {};

        terms.forEach((term) => {
            next[term.termsId] = checked;
        });

        setCheckedTerms(next);
    }

    const allRequiredAgreed =
        !loading &&
        !error &&
        terms.length > 0 &&
        terms
            .filter((term) => term.requiredYn === "Y")
            .every((term) => checkedTerms[term.termsId] === true);

    const allAgreed =
        terms.length > 0 &&
        terms.every((term) => checkedTerms[term.termsId] === true);

    function handleSubmit() {
        if (!allRequiredAgreed || submitting) {
            return;
        }

        const agreedTermsIds = terms
            .filter((term) => checkedTerms[term.termsId] === true)
            .map((term) => term.termsId);

        onNext(agreedTermsIds);
    }

    return (
        <div className="terms-page">
            <div className="terms-container">

                <div className="terms-heading">
                    <span className="terms-step">대출 신청 · 약관 동의</span>
                    <h1>대출 신청을 위한 약관 동의</h1>
                    <p>
                        아래 약관을 확인하고 동의해주세요.
                    </p>
                </div>

                {selectedProduct && (
                    <div className="terms-product-summary">
                        <span>선택한 대출 상품</span>
                        <strong>{selectedProduct.productName}</strong>
                    </div>
                )}

                {loading && <p>약관을 불러오는 중입니다...</p>}

                {error && (
                    <p className="terms-error" role="alert">
                        {error}
                    </p>
                )}

                {!loading && !error && (
                    <div className="terms-card">

                        <label className="terms-all-check">
                            <input
                                type="checkbox"
                                checked={allAgreed}
                                onChange={handleCheckAll}
                                disabled={submitting || terms.length === 0}
                            />
                            <strong>전체 약관 동의</strong>
                        </label>

                        <p className="terms-helper">
                            선택 약관은 동의하지 않아도 대출 신청이 가능합니다.
                        </p>

                        <div className="terms-list">
                            {terms.map((term) => (
                                <div className="terms-item" key={term.termsId}>

                                    <label className="terms-item-label">
                                        <input
                                            type="checkbox"
                                            checked={
                                                checkedTerms[term.termsId] === true
                                            }
                                            onChange={(event) =>
                                                handleCheck(
                                                    term.termsId,
                                                    event.target.checked
                                                )
                                            }
                                            disabled={submitting}
                                        />

                                        <span
                                            className={
                                                term.requiredYn === "Y"
                                                    ? "terms-required"
                                                    : "terms-optional"
                                            }
                                        >
                      {term.requiredYn === "Y"
                          ? "[필수]"
                          : "[선택]"}
                    </span>

                                        <span>{term.termsName}</span>
                                    </label>

                                    <button
                                        type="button"
                                        className="terms-view-button"
                                        onClick={() => setSelectedTermId(term.termsId)}
                                    >
                                        내용 보기
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {submitError && (
                    <p className="terms-error" role="alert">
                        {submitError}
                    </p>
                )}

                <div className="terms-actions">
                    <button
                        type="button"
                        className="terms-back-button"
                        onClick={onBack}
                        disabled={submitting}
                    >
                        이전
                    </button>

                    <button
                        type="button"
                        className="terms-next-button"
                        onClick={handleSubmit}
                        disabled={!allRequiredAgreed || submitting}
                    >
                        {submitting
                            ? "신청서 생성 중..."
                            : "동의하고 다음"}
                    </button>
                </div>

                {selectedTermId !== null && (
                    <div
                        className="terms-modal-overlay"
                        onClick={() => setSelectedTermId(null)}
                    >
                        <div
                            className="terms-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-label="약관 상세 내용"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="terms-modal-header">
                                <h2>약관 상세 내용</h2>

                                <button
                                    type="button"
                                    onClick={() => setSelectedTermId(null)}
                                >
                                    닫기
                                </button>
                            </div>

                            <div className="terms-modal-content">
                                {contentLoading
                                    ? "약관 내용을 불러오는 중입니다..."
                                    : termContent}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
