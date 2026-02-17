// Mock integrations for static site
export const Core = {
    InvokeLLM: async () => ({}),
    SendEmail: async () => ({}),
    SendSMS: async () => ({}),
    UploadFile: async () => ({}),
    GenerateImage: async () => ({}),
    ExtractDataFromUploadedFile: async () => ({}),
};

export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const SendSMS = Core.SendSMS;
export const UploadFile = Core.UploadFile;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;
