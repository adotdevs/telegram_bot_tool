/** Light template rewriter: swap common words when they appear as whole tokens */
export declare function synonymizeTemplate(template: string): string;
/** Simple structural variants: optional greeting prefix / closing */
export declare function varyStructure(text: string): string;
export declare function applyTemplateVars(template: string, vars: Record<string, string>): string;
export declare function maybeAiVary(baseText: string, useAi: boolean): Promise<string>;
export declare function buildMessageText(template: string, vars: Record<string, string>, useAi: boolean): Promise<string>;
//# sourceMappingURL=messageVariator.d.ts.map