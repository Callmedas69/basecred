import { NextResponse } from "next/server";
import { getAllContexts } from "basecred-decision-engine";

export async function GET() {
    try {
        const contexts = getAllContexts();
        
        return NextResponse.json({
            contexts
        });

    } catch (error: any) {
        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: error.message || "Unknown error" },
            { status: 500 }
        );
    }
}
