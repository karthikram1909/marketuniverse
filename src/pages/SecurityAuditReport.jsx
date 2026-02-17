import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, XCircle, Info, Lock, Database, Code, Key } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function SecurityAuditReport() {
    const vulnerabilities = {
        critical: [
            {
                title: "Hardcoded Admin Credentials in Frontend",
                location: "pages/TraditionalPoolAdmin.jsx (lines 19-20)",
                description: "Admin email and wallet address are hardcoded in the frontend code, making them publicly visible to anyone who inspects the source code.",
                code: `const ADMIN_EMAIL = 'helloworld13202213@gmail.com';\nconst ADMIN_WALLET = '0x66b88328ba305caac8766c02b450420a9a0a31f2';`,
                impact: "Attackers know exactly which accounts to target. Email visible for phishing attacks.",
                recommendation: "Move admin verification to backend. Use Admin entity lookup instead of hardcoded values."
            },
            {
                title: "Client-Side Admin Authorization",
                location: "pages/MainPoolAdmin.jsx, pages/TraditionalPoolAdmin.jsx, pages/ScalpingPoolAdmin.jsx",
                description: "Admin checks are performed only on the frontend using user.role === 'admin'. A malicious user can bypass this by modifying the frontend code or intercepting API calls.",
                code: `if (currentUser.role !== 'admin') {\n    alert('Access denied. Admin only.');\n    navigate(createPageUrl('Home'));\n    return;\n}`,
                impact: "Complete bypass of admin authorization. Attackers can access all admin functions if backend lacks proper authorization.",
                recommendation: "Backend must enforce role-based access control. Frontend checks are for UX only, not security."
            },
            {
                title: "Email Verification Code Enumeration",
                location: "components/auth/VerificationModal.jsx",
                description: "6-digit codes (100000-999999) can be brute-forced. System doesn't appear to rate-limit verification attempts.",
                code: `const code = Math.floor(100000 + Math.random() * 900000).toString();`,
                impact: "Attackers can brute force 6-digit codes to gain admin access within minutes if no rate limiting exists.",
                recommendation: "Implement rate limiting, account lockout after failed attempts, and use longer/more complex codes."
            },
            {
                title: "Sensitive Data Exposure in localStorage",
                location: "pages/GeneralAdmin.jsx (lines 574-579)",
                description: "Admin verification session stored in localStorage without encryption, accessible to XSS attacks and browser extensions.",
                code: `localStorage.setItem('admin_verification_session', JSON.stringify(session));`,
                impact: "Session hijacking possible through XSS or malicious browser extensions.",
                recommendation: "Use httpOnly cookies for session storage or implement encryption. Consider server-side session management."
            }
        ],
        high: [
            {
                title: "No Input Validation on Financial Transactions",
                location: "Multiple components (DepositForm, WithdrawalForm, TradeForm)",
                description: "Financial amounts and addresses aren't validated before submission. Negative amounts, invalid addresses, or malformed data could be submitted.",
                impact: "Data corruption, negative balances, or invalid transactions in the database.",
                recommendation: "Implement strict input validation, sanitization, and server-side verification of all financial data."
            },
            {
                title: "Wallet Address Case Sensitivity Issues",
                location: "Throughout codebase",
                description: "Wallet addresses are lowercased for storage but not consistently validated. Some lookups might fail if case isn't normalized.",
                impact: "Users might not be able to access their data if addresses aren't normalized consistently.",
                recommendation: "Implement a utility function to normalize all wallet addresses and use it consistently."
            },
            {
                title: "Race Conditions in Financial Calculations",
                location: "pages/MainPool.jsx, pages/TraditionalPool.jsx (calculateUserStats)",
                description: "Financial calculations happen client-side with data that could be stale. Multiple simultaneous transactions could cause calculation errors.",
                impact: "Incorrect balance displays, withdrawal of more than available, or double-spending scenarios.",
                recommendation: "Move all financial calculations to backend with transaction locks and atomic operations."
            },
            {
                title: "CSRF Token Missing",
                location: "All forms and mutations",
                description: "No CSRF protection visible in the frontend. State-changing operations could be triggered by malicious websites.",
                impact: "Attackers could trick authenticated users into making unwanted transactions via malicious links.",
                recommendation: "Implement CSRF tokens for all state-changing operations."
            },
            {
                title: "No Rate Limiting on Entity Operations",
                location: "All entity CRUD operations",
                description: "Entity operations can be called repeatedly without apparent rate limiting (except recent manual cooldowns).",
                impact: "DoS attacks possible by flooding the system with requests. Data spam attacks.",
                recommendation: "Implement comprehensive backend rate limiting on all API endpoints."
            }
        ],
        medium: [
            {
                title: "Email Sent in Plain Text",
                location: "pages/GeneralAdmin.jsx (lines 104-108)",
                description: "Verification codes sent via email without encryption. Email can be intercepted.",
                impact: "Codes could be intercepted in transit, especially on unsecured networks.",
                recommendation: "Use TLS for email transmission, consider time-limited one-time links instead of codes."
            },
            {
                title: "Insufficient Session Timeout",
                location: "pages/GeneralAdmin.jsx (line 577)",
                description: "Admin sessions last 24 hours, which is quite long for high-privilege access.",
                code: `expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours`,
                impact: "Stolen sessions remain valid for a full day, increasing window of opportunity for attackers.",
                recommendation: "Reduce to 1-4 hours for admin sessions, implement idle timeout, require re-auth for sensitive operations."
            },
            {
                title: "No User Activity Logging",
                location: "All admin operations",
                description: "No audit trail of who did what and when. Critical for financial applications.",
                impact: "Cannot detect or trace unauthorized access or fraudulent activities.",
                recommendation: "Implement comprehensive audit logging for all admin actions, financial transactions, and sensitive operations."
            },
            {
                title: "Batch Delete Operations Without Confirmation",
                location: "pages/GeneralAdmin.jsx (batchDelete function)",
                description: "Mass deletion operations with minimal confirmation, could lead to accidental data loss.",
                impact: "Accidental deletion of large amounts of critical financial data.",
                recommendation: "Add multi-step confirmation for bulk operations, implement soft deletes with recovery period."
            },
            {
                title: "Transaction Hash Not Verified",
                location: "All payment processing flows",
                description: "Transaction hashes are stored but not verified against blockchain. Users could submit fake hashes.",
                impact: "Users could claim deposits without actually sending funds.",
                recommendation: "Implement blockchain transaction verification before crediting deposits."
            }
        ],
        low: [
            {
                title: "Verbose Error Messages",
                location: "Throughout codebase (console.error statements)",
                description: "Detailed error messages logged to console could reveal system internals.",
                impact: "Information disclosure that could help attackers understand system architecture.",
                recommendation: "Implement proper error handling with user-friendly messages, log details server-side only."
            },
            {
                title: "No Content Security Policy",
                location: "Application-wide",
                description: "No CSP headers to prevent XSS attacks.",
                impact: "Increased risk of XSS attacks.",
                recommendation: "Implement strict CSP headers."
            },
            {
                title: "Terms Modal Can Be Bypassed",
                location: "components/wallet/WalletContext.jsx (lines 40-62)",
                description: "Terms acceptance modal can be bypassed on certain pages. User could interact without accepting terms.",
                impact: "Legal compliance issues, users could claim they never accepted terms.",
                recommendation: "Enforce terms acceptance before any financial operations, not just on certain pages."
            }
        ],
        positive: [
            {
                title: "Two-Factor Authentication for Admin",
                description: "Email-based verification implemented for admin access."
            },
            {
                title: "Wallet-Based Authentication",
                description: "Using MetaMask wallet signatures for user identity, leveraging blockchain security."
            },
            {
                title: "BSC Network Enforcement",
                description: "System ensures users are on the correct network before transactions."
            },
            {
                title: "Session Expiry Implementation",
                description: "Verification codes expire after 5 minutes, admin sessions expire after 24 hours."
            },
            {
                title: "Recent Rate Limiting Improvements",
                description: "Cooldown timers added for lock toggles and batch operations to prevent rate limit errors."
            }
        ]
    };

    const getSeverityColor = (severity) => {
        switch(severity) {
            case 'critical': return 'from-red-500/20 to-rose-600/20 border-red-500/50';
            case 'high': return 'from-orange-500/20 to-amber-600/20 border-orange-500/50';
            case 'medium': return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/50';
            case 'low': return 'from-blue-500/20 to-cyan-600/20 border-blue-500/50';
            default: return 'from-gray-500/20 to-gray-600/20 border-gray-500/50';
        }
    };

    const getSeverityIcon = (severity) => {
        switch(severity) {
            case 'critical': return <XCircle className="w-6 h-6 text-red-400" />;
            case 'high': return <AlertTriangle className="w-6 h-6 text-orange-400" />;
            case 'medium': return <Info className="w-6 h-6 text-yellow-400" />;
            case 'low': return <Info className="w-6 h-6 text-blue-400" />;
            default: return <Info className="w-6 h-6 text-gray-400" />;
        }
    };

    const renderVulnerabilities = (severity, items) => (
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
                {getSeverityIcon(severity)}
                <h2 className="text-2xl font-bold text-white capitalize">
                    {severity} Severity ({items.length})
                </h2>
            </div>
            <div className="space-y-4">
                {items.map((vuln, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`bg-gradient-to-br ${getSeverityColor(severity)} border rounded-2xl p-6`}
                    >
                        <h3 className="text-xl font-bold text-white mb-2">{vuln.title}</h3>
                        {vuln.location && (
                            <p className="text-gray-400 text-sm mb-3 font-mono">📍 {vuln.location}</p>
                        )}
                        <p className="text-gray-300 mb-4">{vuln.description}</p>
                        {vuln.code && (
                            <pre className="bg-black/50 border border-white/10 rounded-lg p-4 mb-4 overflow-x-auto">
                                <code className="text-gray-300 text-sm">{vuln.code}</code>
                            </pre>
                        )}
                        {vuln.impact && (
                            <div className="mb-3">
                                <span className="text-red-400 font-semibold">⚠️ Impact: </span>
                                <span className="text-gray-300">{vuln.impact}</span>
                            </div>
                        )}
                        {vuln.recommendation && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                <span className="text-green-400 font-semibold">✅ Recommendation: </span>
                                <span className="text-gray-300">{vuln.recommendation}</span>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0f1a] px-6 py-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link to={createPageUrl('GeneralAdmin')}>
                        <Button variant="ghost" className="text-gray-400 hover:text-white mb-4">
                            ← Back to Admin
                        </Button>
                    </Link>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white">Security Penetration Test Report</h1>
                            <p className="text-gray-400">Generated: {new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Executive Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-8 mb-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">Executive Summary</h2>
                    <div className="grid md:grid-cols-4 gap-6 mb-6">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-red-400 mb-2">
                                {vulnerabilities.critical.length}
                            </div>
                            <div className="text-gray-400">Critical</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-orange-400 mb-2">
                                {vulnerabilities.high.length}
                            </div>
                            <div className="text-gray-400">High</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-yellow-400 mb-2">
                                {vulnerabilities.medium.length}
                            </div>
                            <div className="text-gray-400">Medium</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-blue-400 mb-2">
                                {vulnerabilities.low.length}
                            </div>
                            <div className="text-gray-400">Low</div>
                        </div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <p className="text-white font-semibold mb-2">⚠️ Critical Finding:</p>
                        <p className="text-gray-300">
                            The application has <strong className="text-red-400">4 critical vulnerabilities</strong> that 
                            require immediate attention, particularly around admin authentication and authorization. 
                            All admin-related security measures are client-side only, which can be easily bypassed.
                        </p>
                    </div>
                </motion.div>

                {/* Vulnerabilities by Severity */}
                {renderVulnerabilities('critical', vulnerabilities.critical)}
                {renderVulnerabilities('high', vulnerabilities.high)}
                {renderVulnerabilities('medium', vulnerabilities.medium)}
                {renderVulnerabilities('low', vulnerabilities.low)}

                {/* Security Strengths */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        <h2 className="text-2xl font-bold text-white">
                            Security Strengths ({vulnerabilities.positive.length})
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {vulnerabilities.positive.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30 rounded-xl p-4"
                            >
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-white font-bold mb-1">{item.title}</h3>
                                        <p className="text-gray-300 text-sm">{item.description}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Priority Recommendations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-2xl p-8 mb-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-6">Immediate Action Required</h2>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                1
                            </div>
                            <div>
                                <h3 className="text-white font-bold mb-1">Enable Backend Functions & Implement Server-Side Authorization</h3>
                                <p className="text-gray-300 text-sm">
                                    All admin checks must happen on the backend. The frontend currently has no real security - 
                                    it's just UI hiding. Enable backend functions and implement proper role-based access control.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                2
                            </div>
                            <div>
                                <h3 className="text-white font-bold mb-1">Remove Hardcoded Credentials</h3>
                                <p className="text-gray-300 text-sm">
                                    Remove hardcoded admin email/wallet from TraditionalPoolAdmin.jsx. Use Admin entity for all authorization checks.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                3
                            </div>
                            <div>
                                <h3 className="text-white font-bold mb-1">Implement Rate Limiting & Brute Force Protection</h3>
                                <p className="text-gray-300 text-sm">
                                    Add rate limiting on verification code attempts, lock accounts after failed attempts, use stronger codes.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                4
                            </div>
                            <div>
                                <h3 className="text-white font-bold mb-1">Move Financial Calculations to Backend</h3>
                                <p className="text-gray-300 text-sm">
                                    All balance calculations, PnL, and profit sharing must be computed server-side with proper transaction handling.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                5
                            </div>
                            <div>
                                <h3 className="text-white font-bold mb-1">Implement Blockchain Transaction Verification</h3>
                                <p className="text-gray-300 text-sm">
                                    Verify all transaction hashes against the blockchain before crediting deposits or accepting payments.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Security Architecture Recommendations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-6">Security Architecture Recommendations</h2>
                    
                    <div className="space-y-6">
                        <div className="border-l-4 border-cyan-500 pl-6">
                            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                <Lock className="w-5 h-5" />
                                Authentication & Authorization
                            </h3>
                            <ul className="space-y-2 text-gray-300">
                                <li>• Move all admin checks to backend with proper JWT/session validation</li>
                                <li>• Implement role-based access control (RBAC) at the API level</li>
                                <li>• Use environment variables for sensitive configuration</li>
                                <li>• Implement account lockout after 5 failed login attempts</li>
                                <li>• Reduce admin session timeout to 4 hours maximum</li>
                                <li>• Require re-authentication for sensitive operations (withdrawals, user deletion)</li>
                            </ul>
                        </div>

                        <div className="border-l-4 border-green-500 pl-6">
                            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                <Database className="w-5 h-5" />
                                Data Integrity & Validation
                            </h3>
                            <ul className="space-y-2 text-gray-300">
                                <li>• Implement server-side validation for all inputs</li>
                                <li>• Add database constraints (CHECK, NOT NULL, UNIQUE)</li>
                                <li>• Use database transactions for financial operations</li>
                                <li>• Implement optimistic locking to prevent race conditions</li>
                                <li>• Add audit tables to track all data changes</li>
                                <li>• Implement soft deletes with 30-day recovery period</li>
                            </ul>
                        </div>

                        <div className="border-l-4 border-yellow-500 pl-6">
                            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                <Code className="w-5 h-5" />
                                Application Security
                            </h3>
                            <ul className="space-y-2 text-gray-300">
                                <li>• Implement Content Security Policy (CSP) headers</li>
                                <li>• Add CSRF tokens to all state-changing operations</li>
                                <li>• Sanitize all user inputs to prevent XSS</li>
                                <li>• Use HTTPS only with HSTS headers</li>
                                <li>• Implement proper error handling without information disclosure</li>
                                <li>• Add security headers (X-Frame-Options, X-Content-Type-Options, etc.)</li>
                            </ul>
                        </div>

                        <div className="border-l-4 border-purple-500 pl-6">
                            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                <Key className="w-5 h-5" />
                                Blockchain & Crypto Security
                            </h3>
                            <ul className="space-y-2 text-gray-300">
                                <li>• Verify all transaction hashes against BSC blockchain</li>
                                <li>• Implement pending deposit confirmation queue</li>
                                <li>• Add transaction amount validation against blockchain data</li>
                                <li>• Monitor for duplicate transaction hashes</li>
                                <li>• Implement withdrawal whitelist/cooldown periods</li>
                                <li>• Add multi-signature requirements for large withdrawals</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>

                {/* Disclaimer */}
                <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-blue-400 font-semibold mb-2">Note on Base44 Platform Security:</p>
                            <p className="text-gray-300 text-sm">
                                This audit focuses on application-level vulnerabilities in the frontend code. 
                                The Base44 platform itself may have backend security measures that are not visible in this audit. 
                                However, relying solely on frontend security checks is a critical vulnerability regardless of backend security.
                                <br/><br/>
                                <strong className="text-white">Most critical issues can only be resolved by enabling Backend Functions</strong> in your app settings, 
                                which will allow you to implement proper server-side authorization, validation, and security controls.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}