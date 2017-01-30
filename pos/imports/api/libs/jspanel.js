export const JSPanel = ( selector = {}) => {
    let panel = $.jsPanel({
        contentOverflow: 'scroll',
        theme: selector.theme || "teal",
        position: {my: "center", at: "center", offsetY: -10},
        headerTitle: selector.title || "",
        content: selector.content || '<div class="container"><h4 class="text-center">No content rendered</h4></div>',
        footerToolbar: selector.footer || []
    });
    return panel;
};