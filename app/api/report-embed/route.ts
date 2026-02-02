import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    const { url } = await req.json();

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
        return Response.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    try {
        await resend.emails.send({
            from: "Cadence Embedding Report <onboarding@resend.dev>",
            to: ["mail@anthonymham.com"],
            replyTo: "no-reply@cadence.local",
            subject: `Embedding Issue Report: ${url}`,
            text: `
A user reported that the following site does not actually support embedding:

${url}

This site was detected as embeddable but appears to block iframe embedding in practice.
      `,
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Report embed submission error:', error);
        return Response.json({ success: false, error: 'Failed to send report' }, { status: 500 });
    }
}

