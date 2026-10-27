import { useState } from "react";
import "./AdminTermsCreatePage.css";

export default function AdminTermsCreatePage({
                                                 accessToken,
                                                 onBack
                                             }) {
    // ==========================
    // 1. 약관 등록 폼 상태
    // ==========================
    const [form, setForm] = useState({
        termsName: "",
        termsCode: "",
        termsVersion: "",
        content: "",
        requiredYn: "Y"
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // ==========================
    // 2. 입력값 변경
    // ==========================
    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // ==========================
    // 3. 신규 약관 등록
    // ==========================
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (submitting) {
            return;
        }

        setError("");

        // 필수 입력값 검증
        if (
            !form.termsName.trim() ||
            !form.termsCode.trim() ||
            !form.termsVersion.trim() ||
            !form.content.trim()
        ) {
            setError("모든 필수 입력값을 입력해 주세요.");
            return;
        }

        setSubmitting(true);

        try {
            const requestBody = {
                termsName: form.termsName.trim(),
                termsCode: form.termsCode.trim(),
                termsVersion: form.termsVersion.trim(),
                content: form.content.trim(),
                requiredYn: form.requiredYn
            };

            const response = await fetch(
                "/api/admin/terms",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(requestBody)
                }
            );

            if (!response.ok) {
                if (response.status === 400) {
                    throw new Error(
                        "약관 등록 정보를 확인해 주세요."
                    );
                }

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

                if (response.status === 409) {
                    throw new Error(
                        "동일한 코드와 버전의 약관이 이미 존재합니다."
                    );
                }

                throw new Error(
                    "약관 등록에 실패했습니다."
                );
            }

            // 등록 성공 시 목록 화면으로 이동
            onBack();

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "약관 등록 중 오류가 발생했습니다."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ==========================
    // 4. 화면 렌더링
    // ==========================
    return (
        <section className="admin-terms-create-page">

            {/* 목록으로 돌아가기 */}
            <button
                type="button"
                className="admin-back-button admin-terms-back-button"
                onClick={onBack}
                disabled={submitting}
            >
                ← 목록으로 돌아가기
            </button>


            {/* 페이지 제목 */}
            <div className="admin-page-heading">
                <h2>신규 약관 등록</h2>
                <p>
                    대출 신청에 사용할 새로운 약관을 등록합니다.
                </p>
            </div>


            {/* 오류 메시지 */}
            {error && (
                <p className="admin-error" role="alert">
                    {error}
                </p>
            )}

            {/* 등록 폼 */}
            <form
                className="admin-panel admin-terms-create-form"
                onSubmit={handleSubmit}
            >
                <div className="admin-terms-create-form-header">
                    <h3>약관 기본 정보</h3>
                    <p>
                        등록된 약관은 활성 상태로 저장되며,
                        고객의 대출 신청 과정에서 표시됩니다.
                    </p>
                </div>

                <div className="admin-terms-create-grid">

                    {/* 약관명 */}
                    <div className="admin-terms-create-field">
                        <label htmlFor="termsName">
                            약관명 <span className="required-mark">*</span>
                        </label>

                        <input
                            id="termsName"
                            name="termsName"
                            type="text"
                            value={form.termsName}
                            onChange={handleChange}
                            placeholder="예: 개인정보 수집 및 이용 동의"
                            required
                            disabled={submitting}
                        />
                    </div>

                    {/* 약관 코드 */}
                    <div className="admin-terms-create-field">
                        <label htmlFor="termsCode">
                            약관 코드 <span className="required-mark">*</span>
                        </label>

                        <input
                            id="termsCode"
                            name="termsCode"
                            type="text"
                            value={form.termsCode}
                            onChange={handleChange}
                            placeholder="예: PERSONAL_INFO"
                            required
                            disabled={submitting}
                        />
                    </div>

                    {/* 약관 버전 */}
                    <div className="admin-terms-create-field">
                        <label htmlFor="termsVersion">
                            약관 버전 <span className="required-mark">*</span>
                        </label>

                        <input
                            id="termsVersion"
                            name="termsVersion"
                            type="text"
                            value={form.termsVersion}
                            onChange={handleChange}
                            placeholder="예: 1.0"
                            required
                            disabled={submitting}
                        />
                    </div>

                    {/* 필수 동의 여부 */}
                    <div className="admin-terms-create-field">
                        <label htmlFor="requiredYn">
                            필수 동의 여부
                        </label>

                        <select
                            id="requiredYn"
                            name="requiredYn"
                            value={form.requiredYn}
                            onChange={handleChange}
                            disabled={submitting}
                        >
                            <option value="Y">필수</option>
                            <option value="N">선택</option>
                        </select>
                    </div>

                </div>

                {/* 약관 내용 */}
                <div className="admin-terms-create-field">
                    <label htmlFor="content">
                        약관 내용 <span className="required-mark">*</span>
                    </label>

                    <textarea
                        id="content"
                        name="content"
                        value={form.content}
                        onChange={handleChange}
                        rows={12}
                        placeholder="약관 전문을 입력해 주세요."
                        required
                        disabled={submitting}
                    />

                    <p className="admin-terms-create-help">
                        약관 내용은 줄바꿈을 포함하여 저장할 수 있습니다.
                    </p>
                </div>

                {/* 등록 안내 */}
                <div className="admin-terms-create-notice">
                    신규 약관은 활성 상태로 등록됩니다.
                    기존 약관의 내용이나 동의 이력은 변경되지 않습니다.
                </div>

                {/* 하단 버튼 */}
                <div className="admin-terms-create-actions">
                    <button
                        type="button"
                        className="admin-terms-create-cancel"
                        onClick={onBack}
                        disabled={submitting}
                    >
                        취소
                    </button>

                    <button
                        type="submit"
                        className="admin-terms-create-submit"
                        disabled={submitting}
                    >
                        {submitting
                            ? "등록 중..."
                            : "약관 등록"}
                    </button>
                </div>
            </form>
        </section>
    );
}
