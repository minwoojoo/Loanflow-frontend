import { useState } from "react";
import logo from "../../assets/LoanFlow_logo.jpg";
import "./LoginPage.css";

export default function LoginPage({ onLogin }) {
    const [accountId, setAccountId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    accountId,
                    password
                }),
            });

            if(!response.ok){
                if(response.status === 401){
                    throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
                }

                throw new Error("로그인 요청 중 오류가 발생했습니다.");
            }

            const data = await response.json();

            // 로그인 성공 시 App.jsx에 JWT 전달
            onLogin(data);

        } catch(error){
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mobile-container">
            <header className="page-header">로그인</header>

            <main className="login-content">
                <div className="login-brand">
                    <img
                        src={logo}
                        alt="LoanFlow 로고"
                        className="logo-image"
                    />
                    <h1 className="brand-name">LoanFlow</h1>
                    <h2 className="brand-subtitle">비대면 대출</h2>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-fields">
                        <input
                            type="text"
                            placeholder="아이디"
                            aria-label="아이디"
                            autoComplete="username"
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            required
                        />

                        <input
                            type="password"
                            placeholder="비밀번호"
                            aria-label="비밀번호"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <p className="login-error" role="alert">
                            {error}
                        </p>
                        )}

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? "로그인 중..." : "로그인"}
                    </button>
                </form>
            </main>
        </div>
    );
}