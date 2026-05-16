/**
 * integrations.js — Independent replacements for all base44 integrations
 *
 * Replaces:
 *   InvokeLLM              → Google Gemini API (free tier)
 *   SendEmail              → Resend API
 *   UploadFile             → Supabase Storage (public bucket)
 *   UploadPrivateFile      → Supabase Storage (private bucket)
 *   CreateFileSignedUrl    → Supabase Storage signed URLs
 *   GenerateImage          → Stability AI API
 *   ExtractDataFromUploadedFile → Google Gemini Vision API
 *
 * All functions keep the same signature as the base44 originals
 * so no changes are needed in your pages/components.
 *
 * ENVIRONMENT VARIABLES NEEDED (.env):
 *   VITE_GEMINI_API_KEY=your_gemini_key_here
 *   VITE_RESEND_API_KEY=your_resend_key_here
 *   VITE_STABILITY_API_KEY=your_stability_key_here  (optional - for image generation)
 *   VITE_SUPABASE_URL=your_supabase_url
 *   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
 */

import { supabase } from './supabaseClient';

// ─── InvokeLLM ─────────────────────────────────────────────────────────────────
// Replaces: base44.integrations.Core.InvokeLLM
// Uses: Google Gemini API (free tier: 15 req/min, 1M tokens/day)
//
// Usage (identical to before):
//   const result = await InvokeLLM({
//     prompt: "Summarise this invoice",
//     response_json_schema: { type: "object", properties: { summary: { type: "string" } } }
//   });

export async function InvokeLLM({ prompt, response_json_schema, add_context_from_internet = false }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing VITE_GEMINI_API_KEY in .env');

  const model = 'gemini-1.5-flash'; // Free tier model
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // If a JSON schema is requested, instruct Gemini to return structured JSON
  const systemInstruction = response_json_schema
    ? `You must respond with valid JSON only, matching this schema: ${JSON.stringify(response_json_schema)}. Do not include markdown code blocks.`
    : 'You are a helpful ERP assistant.';

  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      ...(response_json_schema ? { response_mime_type: 'application/json' } : {}),
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Gemini API error: ${err.error?.message ?? response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // If JSON was requested, parse and return the object
  if (response_json_schema) {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Gemini returned invalid JSON: ${text}`);
    }
  }

  return text;
}

// ─── SendEmail ─────────────────────────────────────────────────────────────────
// Replaces: base44.integrations.Core.SendEmail
// Uses: Resend API (free tier: 3,000 emails/month)
//
// Usage (identical to before):
//   await SendEmail({
//     to: 'client@example.com',
//     subject: 'Your Invoice',
//     body: '<p>Please find your invoice attached.</p>'
//   });

export async function SendEmail({ to, subject, body, from }) {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  if (!apiKey) throw new Error('Missing VITE_RESEND_API_KEY in .env');

  const fromAddress = from ?? import.meta.env.VITE_EMAIL_FROM ?? 'noreply@edgeclouderp.com';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: body,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Resend API error: ${err.message ?? response.statusText}`);
  }

  return await response.json();
}

// ─── UploadFile ────────────────────────────────────────────────────────────────
// Replaces: base44.integrations.Core.UploadFile
// Uses: Supabase Storage (public bucket)
//
// Usage (identical to before):
//   const { file_url } = await UploadFile({ file: fileObject });

export async function UploadFile({ file }) {
  if (!file) throw new Error('No file provided to UploadFile');

  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
  const bucket = 'public-files';

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) throw new Error(`File upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return { file_url: data.publicUrl, file_name: fileName };
}

// ─── UploadPrivateFile ─────────────────────────────────────────────────────────
// Replaces: base44.integrations.Core.UploadPrivateFile
// Uses: Supabase Storage (private bucket — requires signed URL to access)
//
// Usage (identical to before):
//   const { file_url } = await UploadPrivateFile({ file: fileObject });

export async function UploadPrivateFile({ file }) {
  if (!file) throw new Error('No file provided to UploadPrivateFile');

  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
  const bucket = 'private-files';

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) throw new Error(`Private file upload failed: ${error.message}`);

  // Return the path — use CreateFileSignedUrl to generate access URLs
  return { file_url: fileName, file_name: fileName };
}

// ─── CreateFileSignedUrl ───────────────────────────────────────────────────────
// Replaces: base44.integrations.Core.CreateFileSignedUrl
// Uses: Supabase Storage signed URLs (expire after set duration)
//
// Usage (identical to before):
//   const { signed_url } = await CreateFileSignedUrl({
//     file_path: 'filename.pdf',
//     expires_in: 3600
//   });

export async function CreateFileSignedUrl({ file_path, expires_in = 3600 }) {
  if (!file_path) throw new Error('No file_path provided to CreateFileSignedUrl');

  const bucket = 'private-files';
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(file_path, expires_in);

  if (error) throw new Error(`Signed URL creation failed: ${error.message}`);
  return { signed_url: data.signedUrl };
}

// ─── GenerateImage ─────────────────────────────────────────────────────────────
// Replaces: base44.integrations.Core.GenerateImage
// Uses: Stability AI API (free trial credits available at stability.ai)
// NOTE: If you don't need image generation, you can skip this for now.
//
// Usage (identical to before):
//   const { image_url } = await GenerateImage({ prompt: 'A professional logo' });

export async function GenerateImage({ prompt, width = 512, height = 512 }) {
  const apiKey = import.meta.env.VITE_STABILITY_API_KEY;

  // Graceful fallback if no key configured
  if (!apiKey) {
    console.warn('VITE_STABILITY_API_KEY not set — image generation disabled');
    return { image_url: null, error: 'Image generation not configured' };
  }

  const response = await fetch(
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt, weight: 1 }],
        cfg_scale: 7,
        height,
        width,
        samples: 1,
        steps: 30,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Stability AI error: ${err.message ?? response.statusText}`);
  }

  const data = await response.json();
  const base64 = data.artifacts?.[0]?.base64;
  if (!base64) throw new Error('No image returned from Stability AI');

  // Convert base64 to a data URL
  return { image_url: `data:image/png;base64,${base64}` };
}

// ─── ExtractDataFromUploadedFile ───────────────────────────────────────────────
// Replaces: base44.integrations.Core.ExtractDataFromUploadedFile
// Uses: Google Gemini Vision API (free tier)
// Supports: PDFs, images, spreadsheets — extracts structured data
//
// Usage (identical to before):
//   const result = await ExtractDataFromUploadedFile({
//     file: fileObject,
//     json_schema: { type: 'object', properties: { total: { type: 'number' } } }
//   });

export async function ExtractDataFromUploadedFile({ file, json_schema, instructions }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing VITE_GEMINI_API_KEY in .env');

  // Convert file to base64
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const prompt = instructions
    ?? `Extract all relevant data from this document and return it as JSON matching this schema: ${JSON.stringify(json_schema ?? {})}`;

  const model = 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: file.type || 'application/octet-stream', data: base64 } },
      ],
    }],
    generationConfig: {
      temperature: 0.1,
      response_mime_type: 'application/json',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Gemini Vision error: ${err.error?.message ?? response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

  try {
    return JSON.parse(text);
  } catch {
    return { raw_text: text };
  }
}

// ─── Core (namespace export for compatibility) ─────────────────────────────────
// Some components may import { Core } and call Core.InvokeLLM etc.
export const Core = {
  InvokeLLM,
  SendEmail,
  UploadFile,
  UploadPrivateFile,
  CreateFileSignedUrl,
  GenerateImage,
  ExtractDataFromUploadedFile,
};
