/* eslint-disable no-param-reassign */
import * as postcss from "postcss";
import selectorParser from 'postcss-selector-parser';

export default postcss.plugin('gtk-color-variables', () => (css, processor) => css.walkRules((rule) => {
    const transform = selectors => {
        selectors.walk(selector => {
            // do something with the selector
            if (selector.type === "tag") {
                if (selector.value === "entry") {
                    selector.replaceWith(selectorParser.tag({value: "input"}));
                } else {
                    selector.replaceWith(selectorParser.className({value: selector.value}));
                }
            } else if (selector.type === "pseudo") {
                switch (selector.value) {
                    case ":selected":
                        selector.replaceWith(selectorParser.className({value: "selected"}));
                        break;
                    case ":insensitive":
                        selector.replaceWith(selectorParser.pseudo({value: ":disabled"}));
                        break;
                    case ":inconsistent":
                        selector.replaceWith(selectorParser.pseudo({value: ":indeterminate"}));
                        break;
                    case ":prelight":
                        selector.replaceWith(selectorParser.pseudo({value: ":hover"}));
                        break;
                    case ":focused":
                        selector.replaceWith(selectorParser.pseudo({value: ":focus"}));
                        break;
                    case ":backdrop":
                        // console.log(selector);
                        // console.log(selector.parent.toString());
                        break;
                    default:
                }
            }
        });
    };
    rule.selector = selectorParser(transform).processSync(rule.selector);

    if (rule.selector.indexOf(':backdrop') !== -1) {
        const ref = postcss.list.comma(rule.selector);
        const selectors = [];
        for (let i = 0; i < ref.length; i++) {
            let selector = ref[i];
            if (selector.indexOf(':backdrop') !== -1) {
                selector = '.backdrop ' + selector.replace(':backdrop', '');
            }
            selectors.push(selector);
        }
        rule.selector = selectors.join(',\n');
    }
}));
