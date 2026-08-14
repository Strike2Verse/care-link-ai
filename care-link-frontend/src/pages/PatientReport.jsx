import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const PatientReport = () => {
    const { patientId } = useParams();

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const { data } = await axios.get(
                    `http://localhost:5005/api/patient-data/public-report/${patientId}`
                );
                setReportData(data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching patient report:', err);
                const message =
                    err.response?.data?.message || 'Failed to retrieve patient report.';
                setError(message);
                setLoading(false);
            }
        };

        fetchReport();
    }, [patientId]);

    /* ─── Loading State ─── */
    if (loading) {
        return (
            <div style={styles.pageWrap}>
                <div style={styles.container}>
                    <div style={{ ...styles.skeletonBlock, height: 80 }} />
                    <div style={{ ...styles.skeletonBlock, height: 180, marginTop: 24 }} />
                    <div style={{ ...styles.skeletonBlock, height: 120, marginTop: 24 }} />
                </div>
            </div>
        );
    }

    /* ─── Error State ─── */
    if (error) {
        return (
            <div style={styles.pageWrap}>
                <div style={styles.errorCard}>
                    <div style={styles.errorIcon}>⚠️</div>
                    <h2 style={styles.errorTitle}>Access Restricted</h2>
                    <p style={styles.errorMsg}>{error}</p>
                    <p style={styles.errorHint}>
                        Please verify that the URL is correct or request the patient to check their QR code.
                    </p>
                </div>
            </div>
        );
    }

    const initial = reportData.fullName ? reportData.fullName.charAt(0).toUpperCase() : 'E';

    return (
        <div style={styles.pageWrap}>
            <div style={styles.container}>
                {/* Header Banner */}
                <div style={styles.header}>
                    <div style={styles.headerLeft}>
                        <span style={styles.headerIcon}>🏥</span>
                        <div>
                            <p style={styles.headerSub}>CareLink Health Profile</p>
                            <h1 style={styles.headerTitle}>Overview Dashboard</h1>
                        </div>
                    </div>
                    <span style={styles.badge}>Live Data</span>
                </div>

                {/* Patient Identity Card */}
                <div style={styles.card}>
                    <div style={styles.profileRow}>
                        <div style={styles.avatar}>{initial}</div>
                        <div>
                            <p style={styles.patientLabel}>Patient Name</p>
                            <h2 style={styles.patientName}>{reportData.fullName}</h2>
                        </div>
                    </div>
                </div>

                {/* Records & Document Counts */}
                <div style={styles.card}>
                    <h3 style={styles.sectionTitle}>
                        <span>📁</span> Health Records & Docs Counts
                    </h3>
                    <div style={styles.countsGrid}>
                        <div style={styles.countCard}>
                            <span style={styles.countIcon}>📄</span>
                            <div>
                                <div style={styles.countValue}>{reportData.documentCount || 0}</div>
                                <div style={styles.countLabel}>Medical Documents</div>
                            </div>
                        </div>
                        <div style={styles.countCard}>
                            <span style={styles.countIcon}>💊</span>
                            <div>
                                <div style={styles.countValue}>{reportData.medicationCount || 0}</div>
                                <div style={styles.countLabel}>Active Medications</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vitals Summary */}
                <div style={styles.card}>
                    <h3 style={styles.sectionTitle}>
                        <span>📊</span> Vitals Summary
                    </h3>
                    {reportData.vitals && Object.keys(reportData.vitals).length > 0 ? (
                        <div style={styles.vitalsGrid}>
                            {Object.entries(reportData.vitals).map(([type, data]) => {
                                const isGood = data.status === 'Good' || data.status === 'Normal';
                                const isWarning = data.status === 'Warning';
                                const isCritical = data.status === 'Critical';
                                let statusBg = '#f1f5f9';
                                let statusColor = '#64748b';

                                if (isGood) {
                                    statusBg = '#ecfdf5';
                                    statusColor = '#10b981';
                                } else if (isWarning) {
                                    statusBg = '#fffbeb';
                                    statusColor = '#f59e0b';
                                } else if (isCritical) {
                                    statusBg = '#fef2f2';
                                    statusColor = '#ef4444';
                                }

                                return (
                                    <div key={type} style={styles.vitalItem}>
                                        <div style={styles.vitalLabel}>{type}</div>
                                        <div style={styles.vitalValue}>{data.value}</div>
                                        <div style={{ ...styles.vitalStatusBadge, backgroundColor: statusBg, color: statusColor }}>
                                            {data.status || 'N/A'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={styles.emptyBox}>No recent vital logs found.</div>
                    )}
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    <p>Powered by CareLink Public QR Portal</p>
                    <p>© {new Date().getFullYear()} CareLink. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

/* ─── Premium standalone mobile-friendly styling ─── */
const styles = {
    pageWrap: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        padding: '24px 16px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#0f172a',
    },
    container: {
        maxWidth: 600,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    header: {
        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
        color: '#fff',
        padding: '20px 24px',
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(2, 132, 199, 0.15)',
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
    headerIcon: { fontSize: 28 },
    headerSub: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        opacity: 0.9,
        margin: 0,
        fontWeight: 700,
    },
    headerTitle: { margin: 0, fontSize: 18, fontWeight: 800 },
    badge: {
        background: 'rgba(255,255,255,0.15)',
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        border: '1px solid rgba(255,255,255,0.15)',
    },
    card: {
        background: '#fff',
        borderRadius: 16,
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)',
        border: '1px solid #e2e8f0',
    },
    profileRow: { display: 'flex', alignItems: 'center', gap: 16 },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 12,
        background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
        color: '#0284c7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        fontWeight: 800,
    },
    patientLabel: { margin: 0, fontSize: 11, color: '#64748b', fontWeight: 600 },
    patientName: { margin: '2px 0 0', fontSize: 20, fontWeight: 800 },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 700,
        marginTop: 0,
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: '#334155',
    },
    countsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
    },
    countCard: {
        background: '#f8fafc',
        border: '1px solid #f1f5f9',
        borderRadius: 12,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
    countIcon: { fontSize: 22 },
    countValue: { fontSize: 20, fontWeight: 800, color: '#0f172a' },
    countLabel: { fontSize: 11, color: '#64748b', fontWeight: 550 },
    vitalsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 12,
    },
    vitalItem: {
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '12px 14px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
    },
    vitalLabel: {
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: '#64748b',
    },
    vitalValue: { fontSize: 18, fontWeight: 800, color: '#1e293b' },
    vitalStatusBadge: {
        fontSize: 10,
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 12,
        textTransform: 'capitalize',
    },
    emptyBox: {
        background: '#f8fafc',
        border: '2px dashed #cbd5e1',
        borderRadius: 12,
        padding: '24px',
        textAlign: 'center',
        fontSize: 13,
        color: '#94a3b8',
    },
    footer: {
        textAlign: 'center',
        fontSize: 11,
        color: '#94a3b8',
        paddingTop: 16,
    },
    errorCard: {
        maxWidth: 400,
        margin: '40px auto 0',
        background: '#fff',
        borderRadius: 16,
        padding: '32px 24px',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        border: '1px solid #fca5a5',
    },
    errorIcon: { fontSize: 40, marginBottom: 12 },
    errorTitle: { fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' },
    errorMsg: { fontSize: 14, color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 },
    errorHint: {
        fontSize: 11,
        color: '#94a3b8',
        background: '#f8fafc',
        padding: '10px 14px',
        borderRadius: 10,
        border: '1px solid #e2e8f0',
        lineHeight: 1.5,
        margin: 0,
    },
    skeletonBlock: {
        background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
        backgroundSize: '400% 100%',
        borderRadius: 12,
        animation: 'shimmer 1.5s infinite',
    },
};

export default PatientReport;
