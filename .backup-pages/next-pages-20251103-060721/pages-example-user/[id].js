System.register(["react/jsx-runtime", "app/features/user/detail-screen", "next/head", "solito"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, detail_screen_1, head_1, solito_1, useParam;
    var __moduleName = context_1 && context_1.id;
    function Page() {
        const [id] = useParam('id');
        return (_jsxs(_Fragment, { children: [_jsx(head_1.default, { children: _jsx("title", { children: "User" }) }), _jsx(detail_screen_1.UserDetailScreen, { id: id || '' })] }));
    }
    exports_1("default", Page);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (detail_screen_1_1) {
                detail_screen_1 = detail_screen_1_1;
            },
            function (head_1_1) {
                head_1 = head_1_1;
            },
            function (solito_1_1) {
                solito_1 = solito_1_1;
            }
        ],
        execute: function () {
            useParam = solito_1.createParam().useParam;
        }
    };
});
