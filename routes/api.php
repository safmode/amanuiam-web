<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReportController;

// ============================================
// WEBHOOK FOR NODE.JS
// ============================================
Route::post('/webhook/new-report', function (Request $request) {
    \Log::info('===== WEBHOOK HIT =====', $request->all());

    try {
        $report = new \stdClass();
        $report->reportId = $request->reportId;
        $report->incidentCategory = $request->category ?? 'other';
        $report->mahallah = $request->mahallah ?? 'Unknown';
        $report->description = $request->description ?? 'No description';

        NotificationController::createNewReport($report);

        return response()->json(['success' => true]);
    } catch (\Exception $e) {
        \Log::error('Webhook error: ' . $e->getMessage());
        return response()->json(['success' => false], 500);
    }
});

Route::post('/ai/analyze-report', [ReportController::class, 'analyzeWithAI']);

Route::get('/api/students/search', function (Request $request) {
    $student = App\Models\Student::where('matrixNumber', $request->matric)->first();
    if ($student) {
        return response()->json([
            'student' => [
                '_id' => (string)$student->_id,
                'name' => $student->name,
                'email' => $student->email,
                'phone' => $student->phone,
                'matrixNumber' => $student->matrixNumber,
            ]
        ]);
    }
    return response()->json(['student' => null]);
});

// Your existing API routes can go here if you had any
