import {
    useEffect,
    useState,
} from "react";

import type {
    FormEvent,
} from "react";


import {
    Link,
    useNavigate,
} from "react-router-dom";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { useAuth } from "../auth/AuthContext";

import "./Auth.css";

export default function Register() {
    const navigate = useNavigate();

    const {
        register,
        isAuthenticated,
        loading: authLoading,
    } = useAuth();

    const [
        displayName,
        setDisplayName,
    ] = useState("");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [
        confirmPassword,
        setConfirmPassword,
    ] = useState("");

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
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
        setSuccess("");

        const cleanName =
            displayName.trim();

        const cleanEmail =
            email.trim();

        if (!cleanName) {
            setError(
                "Please enter your display name."
            );

            return;
        }

        if (!cleanEmail) {
            setError(
                "Please enter your email address."
            );

            return;
        }

        if (!password) {
            setError(
                "Please enter a password."
            );

            return;
        }

        if (password.length < 6) {
            setError(
                "Password must be at least 6 characters."
            );

            return;
        }

        if (
            password !==
            confirmPassword
        ) {
            setError(
                "Passwords do not match."
            );

            return;
        }

        try {
            setSubmitting(true);

            await register(
                cleanName,
                cleanEmail,
                password
            );

            setSuccess(
                "Your account has been created successfully."
            );

            /*
             * If registration automatically
             * logged the user in, go home.
             *
             * Otherwise keep the success message
             * and let the user go to login.
             */
            setTimeout(() => {
                navigate("/login", {
                    replace: true,
                });
            }, 700);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to create your account."
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
                            Create Your Account
                        </h1>

                        <p>
                            Join TheColorClone
                            and save your
                            favorite coloring
                            pages.
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

                    {success && (
                        <div
                            className="auth-success"
                            role="status"
                        >
                            {success}
                        </div>
                    )}

                    <form
                        className="auth-form"
                        onSubmit={
                            handleSubmit
                        }
                    >
                        <label htmlFor="displayName">
                            Display Name
                        </label>

                        <input
                            id="displayName"
                            type="text"
                            value={
                                displayName
                            }
                            onChange={(
                                event
                            ) =>
                                setDisplayName(
                                    event
                                        .target
                                        .value
                                )
                            }
                            placeholder="Your name"
                            autoComplete="name"
                            disabled={
                                submitting
                            }
                        />

                        <label htmlFor="registerEmail">
                            Email Address
                        </label>

                        <input
                            id="registerEmail"
                            type="email"
                            value={email}
                            onChange={(
                                event
                            ) =>
                                setEmail(
                                    event
                                        .target
                                        .value
                                )
                            }
                            placeholder="you@example.com"
                            autoComplete="email"
                            disabled={
                                submitting
                            }
                        />

                        <label htmlFor="registerPassword">
                            Password
                        </label>

                        <input
                            id="registerPassword"
                            type="password"
                            value={password}
                            onChange={(
                                event
                            ) =>
                                setPassword(
                                    event
                                        .target
                                        .value
                                )
                            }
                            placeholder="At least 6 characters"
                            autoComplete="new-password"
                            disabled={
                                submitting
                            }
                        />

                        <label htmlFor="confirmPassword">
                            Confirm Password
                        </label>

                        <input
                            id="confirmPassword"
                            type="password"
                            value={
                                confirmPassword
                            }
                            onChange={(
                                event
                            ) =>
                                setConfirmPassword(
                                    event
                                        .target
                                        .value
                                )
                            }
                            placeholder="Repeat your password"
                            autoComplete="new-password"
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
                                ? "Creating account..."
                                : "Create Account"}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <span>
                            Already have an
                            account?
                        </span>

                        <Link to="/login">
                            Sign in
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}