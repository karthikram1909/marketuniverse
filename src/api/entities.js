// Mock entities for static site
// We export static objects matching what the real SDK provides

export const Query = {
    // If the real SDK uses Query.filter(), we support it here:
    filter: async () => [],
    // If usages are `new Query()`, we might need a class, but usually the SDK exports ready-to-use helpers
};

export const User = {
    me: async () => ({
        id: 'static-user',
        name: 'Demo User',
        wallet_address: '0x0000000000000000000000000000000000000000'
    }),
    login: async () => { },
    logout: async () => { },
    redirectToLogin: () => { },
};