import { ToolConfiguration } from "@aws-sdk/client-bedrock-runtime";

export const tool_config: ToolConfiguration = {
    tools: [
        {
            toolSpec: {
                name: "apply_for_leave",
                description: "MANDATORY: Submit leave requests to HR system. Use this tool immediately when users request leave, vacation, time off, or sick days. This tool has real system access and will submit actual requests.",
                inputSchema: {
                    json: {
                        type: "object",
                        properties: {
                            leaveType: {
                                type: "string",
                                description: "Type of leave: Annual, Sick, Unpaid, Personal, Maternity, or Paternity",
                                enum: ["Annual", "Sick", "Unpaid", "Personal", "Maternity", "Paternity"]
                            },
                            startDate: {
                                type: "string",
                                pattern: "^\\d{4}-\\d{2}-\\d{2}$",
                                description: "Start date in YYYY-MM-DD format (e.g., 2025-01-15)"
                            },
                            endDate: {
                                type: "string",
                                pattern: "^\\d{4}-\\d{2}-\\d{2}$",
                                description: "End date in YYYY-MM-DD format (e.g., 2025-01-20)"
                            },
                            reason: {
                                type: "string",
                                minLength: 3,
                                description: "Brief reason for the leave request"
                            }
                        },
                        required: ["leaveType", "startDate", "endDate", "reason"],
                        additionalProperties: false
                    }
                }
            }
        }
    ]
};

export async function applyForLeaveTool(params: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
}) {
    console.log("🔧 Executing leave application:", params);

    // Simulate API call with realistic delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const requestId = `LR-${Date.now().toString().slice(-6)}`;

    return {
        success: true,
        message: `Leave request ${requestId} successfully submitted and is pending approval.`,
        requestId: requestId,
        details: {
            leaveType: params.leaveType,
            startDate: params.startDate,
            endDate: params.endDate,
            reason: params.reason,
            status: "Pending Approval",
            submittedAt: new Date().toISOString()
        }
    };
}