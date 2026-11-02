import {
    useEffect,
    useState,
} from "react";

import type {
    FormEvent,
} from "react";

import {
    Link,
    useLocation,
    useNavigate,
} from "react-router-dom";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { useAuth } from "../auth/AuthContext";

import "./Auth.css";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        login,
        isAuthenticated,
        loading: authLoading,
    } = useAuth();

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [error, setError] =
        useState("");

    const [submitting, setSubmitting] =
        useState(false);

    useEffect(() => {
        if (
            !authLoading &&
            isAuthenticated
        ) {
            navigate("/", {
                replace: true,
            });
        }
    }, [
        authLoading,
        isAuthenticated,
        navigate,
    ]);

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");

        const cleanEmail =
            email.trim();

        if (!cleanEmail) {
            setError(
                "Please enter your email address."
            );

            return;
        }

        if (!password) {
            setError(
                "Please enter your password."
            );

            return;
        }

        try {
            setSubmitting(true);

            await login(
                cleanEmail,
                password
            );

            const from =
                (
                    location.state as
                    | {
                        from?: string;
                    }
                    | null
                )?.from;

            navigate(
                from || "/",
                {
                    replace: true,
                }
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to login. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <>
                <Header />

                <main className="auth-page">
                    <div className="auth-loading">
                        Loading...
                    </div>
                </main>

                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />

            <main className="auth-page">
                <section className="auth-card">
                    <div className="auth-header">
                        <div className="auth-icon">
                            🎨
                        </div>

                        <h1>
                            Welcome Back
                        </h1>

                        <p>
                            Sign in to your
                            coloring account.
                        </p>
                    </div>

                    {error && (
                        <div
                            className="auth-error"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    <form
                        className="auth-form"
                        onSubmit={
                            handleSubmit
                        }
                    >
                        <label htmlFor="email">
                            Email Address
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(
                                    event.target
                                        .value
                                )
                            }
                            placeholder="you@example.com"
                            autoComplete="email"
                            disabled={
                                submitting
                            }
                        />

                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(
                                    event.target
                                        .value
                                )
                            }
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            disabled={
                                submitting
                            }
                        />

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={
                                submitting
                            }
                        >
                            {submitting
                                ? "Signing in..."
                                : "Sign In"}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <span>
                            Do not have an
                            account?
                        </span>

                        <Link to="/register">
                            Create a free account
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}