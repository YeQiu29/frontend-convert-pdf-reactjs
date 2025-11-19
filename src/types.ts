// src/types.ts
export type Feature = {
    api: string;
    needs: 'text' | 'password' | 'multiple-files' | 'file-only' | 'signature' | 'excel-flavor';
    textLabel?: string;
    icon: string;
    title: string;
    description: string;
};
