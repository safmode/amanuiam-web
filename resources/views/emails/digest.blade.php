<!DOCTYPE html>
<html>
<head>
    <title>{{ $type === 'weekly' ? 'Weekly Security Performance Report' : 'Monthly Security Performance Report' }}</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.5;
            background-color: #f0f2f5;
            padding: 40px 20px;
        }

        .container {
            max-width: 700px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        .header {
            background: linear-gradient(135deg, #1a1f36 0%, #2d3748 100%);
            padding: 32px 28px;
            text-align: center;
        }

        .header-icon { font-size: 48px; margin-bottom: 12px; }
        .header h1 { font-size: 26px; font-weight: 700; color: #ffffff; margin-bottom: 8px; }
        .header .date { font-size: 13px; color: #cbd5e1; }

        .content { padding: 32px 28px; }

        .greeting-card {
            background: linear-gradient(135deg, #fef9e6 0%, #fff9ef 100%);
            border-radius: 16px;
            padding: 20px 24px;
            margin-bottom: 28px;
            border: 1px solid #f0e6d2;
        }

        .greeting { font-size: 20px; font-weight: 600; color: #1a1f36; margin-bottom: 6px; }
        .greeting span { color: #D4A853; }
        .greeting-sub { font-size: 13px; color: #64748b; margin-top: 4px; }

        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 32px;
        }

        .stat-card {
            background: #f8fafc;
            border-radius: 14px;
            padding: 16px 8px;
            text-align: center;
        }

        .stat-number { font-size: 26px; font-weight: 800; color: #D4A853; margin-bottom: 6px; }
        .stat-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; }

        /* Section Styles */
        .section { margin-bottom: 32px; }

        .section-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f1f5f9;
        }

        .section-icon { font-size: 22px; }
        .section-title { font-size: 17px; font-weight: 700; color: #1a1f36; }
        .section-badge { margin-left: auto; background: #f1f5f9; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; color: #64748b; }

        /* Officer Table - Using actual HTML table for proper alignment */
        .officer-table-wrapper {
            overflow-x: auto;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
        }

        .officer-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }

        .officer-table th {
            background: #f8fafc;
            padding: 14px 12px;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
        }

        .officer-table td {
            padding: 14px 12px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: middle;
        }

        .officer-table tr:last-child td {
            border-bottom: none;
        }

        .officer-table tr:hover td {
            background: #f8fafc;
        }

        .rank-cell {
            font-weight: 700;
            color: #D4A853;
            width: 50px;
        }

        .officer-name {
            font-weight: 700;
            color: #1a1f36;
            margin-bottom: 2px;
        }

        .officer-rank {
            font-size: 11px;
            color: #94a3b8;
        }

        .cases-cell {
            font-weight: 700;
            color: #3b82f6;
            text-align: center;
            width: 70px;
        }

        .resolved-cell {
            font-weight: 700;
            color: #10b981;
            text-align: center;
            width: 70px;
        }

        .rate-cell {
            font-weight: 700;
            text-align: center;
            width: 80px;
        }

        .rate-excellent { color: #10b981; }
        .rate-good { color: #f59e0b; }
        .rate-poor { color: #ef4444; }

        .performance-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 600;
            margin-left: 10px;
            white-space: nowrap;
        }

        .badge-excellent { background: #d1fae5; color: #059669; }
        .badge-good { background: #fed7aa; color: #ea580c; }
        .badge-poor { background: #fee2e2; color: #dc2626; }

        /* Summary Cards */
        .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin: 20px 0;
        }

        .summary-card {
            background: #f8fafc;
            border-radius: 14px;
            padding: 16px;
        }

        .summary-title {
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
        }

        .summary-item:last-child { border-bottom: none; }
        .summary-name { font-size: 13px; font-weight: 500; color: #1a1f36; }
        .summary-value { font-weight: 700; color: #D4A853; }

        .empty-state {
            text-align: center;
            padding: 20px;
            color: #94a3b8;
            font-size: 13px;
        }

        .empty-success {
            text-align: center;
            padding: 16px;
            color: #10b981;
            font-size: 13px;
            background: #d1fae5;
            border-radius: 12px;
        }

        /* Inactive Officers */
        .inactive-container {
            background: #fef2f2;
            border-radius: 14px;
            padding: 16px;
            border: 1px solid #fecaca;
        }

        .inactive-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 12px;
        }

        .inactive-tag {
            background: white;
            padding: 6px 14px;
            border-radius: 30px;
            font-size: 13px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .inactive-tag-name { font-weight: 600; color: #1a1f36; }
        .inactive-tag-rank { color: #94a3b8; font-size: 11px; margin-left: 6px; }

        .inactive-warning {
            margin-top: 12px;
            font-size: 12px;
            color: #dc2626;
        }

        /* Status Grid */
        .status-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 24px;
        }

        .status-card {
            background: #f8fafc;
            border-radius: 12px;
            padding: 12px;
            text-align: center;
            border-top: 3px solid;
        }

        .status-card.pending { border-top-color: #f59e0b; }
        .status-card.progress { border-top-color: #3b82f6; }
        .status-card.resolved { border-top-color: #10b981; }
        .status-card.nfa { border-top-color: #6b7280; }

        .status-number { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
        .status-number.pending { color: #f59e0b; }
        .status-number.progress { color: #3b82f6; }
        .status-number.resolved { color: #10b981; }
        .status-number.nfa { color: #6b7280; }
        .status-label { font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; }

        /* Urgency Alert */
        .urgency-alert {
            background: #fef2f2;
            border-radius: 12px;
            padding: 14px;
            border: 1px solid #fecaca;
            margin-bottom: 20px;
        }

        .urgency-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .urgency-text { font-weight: 600; color: #dc2626; margin-bottom: 4px; }
        .urgency-count { font-size: 28px; font-weight: 800; color: #dc2626; }

        /* CTA Button */
        .cta-wrapper { text-align: center; margin: 32px 0 16px; }
        .cta-button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, #D4A853 0%, #B8923F 100%);
            color: white;
            text-decoration: none;
            padding: 12px 32px;
            border-radius: 40px;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s;
        }

        .cta-button:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(212, 168, 83, 0.4); }

        /* Footer */
        .footer {
            background: #f8fafc;
            padding: 24px 28px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }

        .footer-text { font-size: 11px; color: #94a3b8; margin-bottom: 8px; }
        .footer-text a { color: #D4A853; text-decoration: none; }
        .copyright { font-size: 10px; color: #cbd5e1; margin-top: 12px; }

        @media (max-width: 600px) {
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
            .status-grid { grid-template-columns: repeat(2, 1fr); }
            .summary-grid { grid-template-columns: 1fr; }

            .officer-table th, .officer-table td {
                padding: 10px 8px;
                font-size: 12px;
            }

            .performance-badge { display: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-icon">🛡️</div>
            <h1>{{ $type === 'weekly' ? 'Weekly Security Performance Report' : 'Monthly Security Performance Report' }}</h1>
            <div class="date">{{ $data['date_range'] ?? now()->format('F j, Y') }}</div>
        </div>

        <div class="content">
            <!-- Greeting -->
            <div class="greeting-card">
                <div class="greeting">Hello, <span>{{ $data['admin_name'] ?? $admin->name }}</span> 👋</div>
                <div class="greeting-sub">Here's your {{ $type === 'weekly' ? 'weekly' : 'monthly' }} security and officer performance summary</div>
            </div>

            <!-- Key Metrics -->
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-number">{{ $data['total_reports'] ?? 0 }}</div><div class="stat-label">Total Reports</div></div>
                <div class="stat-card"><div class="stat-number">{{ $data['resolution_rate'] ?? 0 }}%</div><div class="stat-label">Resolution Rate</div></div>
                <div class="stat-card"><div class="stat-number">{{ $data['total_officers'] ?? 0 }}</div><div class="stat-label">Total Officers</div></div>
                <div class="stat-card"><div class="stat-number">{{ $data['active_officers'] ?? 0 }}</div><div class="stat-label">Active Officers</div></div>
            </div>

            <!-- Urgent Alerts -->
            @if(($data['urgency_stats']['urgent'] ?? 0) > 0)
                <div class="urgency-alert">
                    <div class="urgency-content">
                        <div><div class="urgency-text">🚨 URGENT ALERT</div><div style="font-size: 12px; color: #7f1d1d;">{{ $data['urgency_stats']['urgent'] }} urgent {{ Str::plural('report', $data['urgency_stats']['urgent']) }} require immediate attention</div></div>
                        <div class="urgency-count">{{ $data['urgency_stats']['urgent'] }}</div>
                    </div>
                </div>
            @endif

            <!-- Officer Performance Ranking -->
            <div class="section">
                <div class="section-header">
                    <span class="section-icon">🏆</span>
                    <span class="section-title">Officer Performance Ranking</span>
                    <span class="section-badge">Sorted by cases handled</span>
                </div>

                @if(!empty($data['officer_performance']) && count($data['officer_performance']) > 0)
                    <div class="officer-table-wrapper">
                        <table class="officer-table">
                            <thead>
                                <tr><th>#</th><th>Officer</th><th style="text-align: center">Cases</th><th style="text-align: center">Resolved</th><th style="text-align: center">Rate</th></tr>
                            </thead>
                            <tbody>
                                @foreach($data['officer_performance'] as $index => $officer)
                                    <tr>
                                        <td class="rank-cell">{{ $index + 1 }}</td>
                                        <td>
                                            <div class="officer-name">
                                                {{ $officer['name'] }}
                                                @if($officer['resolution_rate'] >= 90)
                                                    <span class="performance-badge badge-excellent">⭐ Excellent</span>
                                                @elseif($officer['resolution_rate'] >= 70)
                                                    <span class="performance-badge badge-good">👍 Good</span>
                                                @elseif($officer['cases_handled'] > 0 && $officer['resolution_rate'] < 50)
                                                    <span class="performance-badge badge-poor">⚠️ Needs Improvement</span>
                                                @endif
                                            </div>
                                            <div class="officer-rank">{{ $officer['rank'] }} • {{ $officer['department'] }}</div>
                                        </td>
                                        <td class="cases-cell">{{ $officer['cases_handled'] }}</td>
                                        <td class="resolved-cell">{{ $officer['resolved_cases'] }}</td>
                                        <td class="rate-cell {{ $officer['resolution_rate'] >= 90 ? 'rate-excellent' : ($officer['resolution_rate'] >= 70 ? 'rate-good' : 'rate-poor') }}">
                                            {{ $officer['resolution_rate'] }}%
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                @else
                    <div class="officer-table-wrapper">
                        <table class="officer-table">
                            <tbody>
                                <tr><td colspan="5" class="empty-state">📭 No officers have handled any cases this {{ $type === 'weekly' ? 'week' : 'month' }}</td></tr>
                            </tbody>
                        </table>
                    </div>
                @endif
            </div>

            <!-- Performance Summary Cards -->
            @if(!empty($data['officer_performance']) && count($data['officer_performance']) > 0)
                <div class="summary-grid">
                    <!-- Top Performers -->
                    <div class="summary-card">
                        <div class="summary-title">🌟 Top 3 Performers</div>
                        @php $topPerformers = array_slice($data['officer_performance'], 0, 3); @endphp
                        @foreach($topPerformers as $index => $officer)
                            <div class="summary-item">
                                <span class="summary-name">{{ $index + 1 }}. {{ $officer['name'] }}</span>
                                <span class="summary-value">{{ $officer['cases_handled'] }} cases ({{ $officer['resolution_rate'] }}%)</span>
                            </div>
                        @endforeach
                    </div>

                    <!-- Needs Improvement -->
                    <div class="summary-card">
                        <div class="summary-title">⚠️ Needs Improvement</div>
                        @php
                            $needsImprovement = array_filter($data['officer_performance'], function($officer) {
                                return $officer['cases_handled'] > 0 && $officer['resolution_rate'] < 60;
                            });
                        @endphp
                        @if(count($needsImprovement) > 0)
                            @foreach(array_slice($needsImprovement, 0, 3) as $index => $officer)
                                <div class="summary-item">
                                    <span class="summary-name">{{ $index + 1 }}. {{ $officer['name'] }}</span>
                                    <span class="summary-value">{{ $officer['resolution_rate'] }}% rate ({{ $officer['cases_handled'] }} cases)</span>
                                </div>
                            @endforeach
                        @else
                            <div class="empty-success">✅ All officers performing well! Great job everyone!</div>
                        @endif
                    </div>
                </div>
            @endif

            <!-- Inactive Officers -->
            @if(!empty($data['inactive_officers_list']) && count($data['inactive_officers_list']) > 0)
                <div class="section">
                    <div class="section-header">
                        <span class="section-icon">😴</span>
                        <span class="section-title">Inactive Officers</span>
                        <span class="section-badge">{{ count($data['inactive_officers_list']) }} officers</span>
                    </div>
                    <div class="inactive-container">
                        <div class="inactive-list">
                            @foreach($data['inactive_officers_list'] as $officer)
                                <div class="inactive-tag">
                                    <span class="inactive-tag-name">{{ $officer['name'] }}</span>
                                    <span class="inactive-tag-rank">{{ $officer['rank'] }}</span>
                                </div>
                            @endforeach
                        </div>
                        <div class="inactive-warning">⚠️ These officers have not handled any cases this {{ $type === 'weekly' ? 'week' : 'month' }}</div>
                    </div>
                </div>
            @endif

            <!-- Department Performance -->
            @if(!empty($data['department_performance']) && count($data['department_performance']) > 0)
                <div class="section">
                    <div class="section-header">
                        <span class="section-icon">🏢</span>
                        <span class="section-title">Department Performance</span>
                    </div>
                    <div class="officer-table-wrapper">
                        <table class="officer-table">
                            <thead><tr><th>#</th><th>Department</th><th style="text-align: center">Active</th><th style="text-align: center">Cases</th><th style="text-align: center">Rate</th></tr></thead>
                            <tbody>
                                @foreach($data['department_performance'] as $index => $dept)
                                    <tr>
                                        <td class="rank-cell">{{ $index + 1 }}</td>
                                        <td><div class="officer-name">{{ $dept['department'] }}</div></td>
                                        <td class="cases-cell">{{ $dept['active_officers'] }}</td>
                                        <td class="cases-cell">{{ $dept['cases_handled'] }}</td>
                                        <td class="rate-cell {{ $dept['resolution_rate'] >= 80 ? 'rate-excellent' : 'rate-good' }}">{{ $dept['resolution_rate'] }}%</td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>
            @endif

            <!-- Report Status Overview -->
            <div class="section">
                <div class="section-header">
                    <span class="section-icon">📋</span>
                    <span class="section-title">Report Status Overview</span>
                </div>
                <div class="status-grid">
                    <div class="status-card pending"><div class="status-number pending">{{ $data['status_stats']['pending'] ?? 0 }}</div><div class="status-label">Pending</div></div>
                    <div class="status-card progress"><div class="status-number progress">{{ $data['status_stats']['in_progress'] ?? 0 }}</div><div class="status-label">In Progress</div></div>
                    <div class="status-card resolved"><div class="status-number resolved">{{ $data['status_stats']['resolved'] ?? 0 }}</div><div class="status-label">Resolved ✓</div></div>
                    <div class="status-card nfa"><div class="status-number nfa">{{ $data['status_stats']['nfa'] ?? 0 }}</div><div class="status-label">No Action</div></div>
                </div>
            </div>

            <!-- Call to Action -->
            <div class="cta-wrapper">
                <a href="{{ url('/Officers') }}" class="cta-button">View Full Performance Report →</a>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-text">🔔 You're receiving this because you requested a {{ $type }} performance digest</div>
            <div class="footer-text"><a href="{{ url('/settings') }}">⚙️ Manage notification preferences</a></div>
            <div class="copyright">© {{ date('Y') }} Security Management System. All rights reserved.</div>
        </div>
    </div>
</body>
</html>
