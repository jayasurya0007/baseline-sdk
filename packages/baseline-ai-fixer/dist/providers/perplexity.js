import axios from 'axios';
export class PerplexityProvider {
    constructor(config) {
        this.baseURL = 'https://api.perplexity.ai/chat/completions';
        this.apiKey = config.apiKey;
        this.model = config.model || 'llama-3.1-sonar-small-128k-online';
        this.timeout = config.timeout || 30000;
    }
    async isAvailable() {
        if (!this.apiKey || this.apiKey === '') {
            return false;
        }
        try {
            // Simple test request to check API availability
            await axios.post(this.baseURL, {
                model: this.model,
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 10
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async suggestFix(code, issue, context) {
        const prompt = this.buildPrompt(code, issue, context);
        try {
            const response = await axios.post(this.baseURL, {
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert web developer specializing in browser compatibility and modern JavaScript/CSS. Your task is to suggest code fixes that maintain functionality while ensuring wide browser support.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.2, // Lower temperature for more consistent, focused responses
                max_tokens: 1000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.timeout
            });
            const aiResponse = response.data.choices[0].message.content;
            return this.parseResponse(aiResponse, code, issue);
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error;
                if (axiosError.response?.status === 401) {
                    throw new Error('Invalid Perplexity API key. Please check your configuration.');
                }
                else if (axiosError.response?.status === 429) {
                    throw new Error('Perplexity API rate limit exceeded. Please try again later.');
                }
                else if (axiosError.code === 'ECONNABORTED') {
                    throw new Error('Perplexity API request timeout. Please try again.');
                }
            }
            throw new Error(`Failed to get AI suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    buildPrompt(code, issue, context) {
        const featureExplanations = {
            'array-by-copy': 'Array copy methods (toSorted, toReversed, toSpliced, with) are not widely supported. Use spread operator with mutable methods instead.',
            'optional-chaining': 'Optional chaining (?.) may not be supported. Use conditional checks or logical operators.',
            'nullish-coalescing': 'Nullish coalescing (??) may not be supported. Use logical OR (||) or ternary operators.',
            'object-hasown': 'Object.hasOwn() is not widely supported. Use Object.prototype.hasOwnProperty.call() instead.',
            'css-has': ':has() selector is not widely supported. Use alternative CSS selectors or JavaScript.',
            'container-queries': 'Container queries are not widely supported. Use media queries or JavaScript-based solutions.'
        };
        const featureHint = featureExplanations[issue.featureId] || '';
        return `
I have a browser compatibility issue in my code:

**Issue**: ${issue.message}
**Feature ID**: ${issue.featureId}
**Code Type**: ${issue.kind === 'js' ? 'JavaScript' : 'CSS'}
${featureHint ? `**Hint**: ${featureHint}` : ''}

**Problematic Code**:
\`\`\`${issue.kind === 'js' ? 'javascript' : 'css'}
${code}
\`\`\`

${context ? `**Additional Context**:\n${context}\n` : ''}

Please provide:
1. A fixed version of the code that is widely supported across browsers
2. A brief explanation of what changed and why
3. Your confidence level (high/medium/low) in this fix

Format your response as:
FIXED_CODE:
\`\`\`
[your fixed code here]
\`\`\`

EXPLANATION:
[your explanation here]

CONFIDENCE: [high/medium/low]
`.trim();
    }
    parseResponse(aiResponse, originalCode, issue) {
        // Extract fixed code
        const codeMatch = aiResponse.match(/FIXED_CODE:\s*```[\w]*\s*([\s\S]*?)```/i);
        const suggestedCode = codeMatch ? codeMatch[1].trim() : originalCode;
        // Extract explanation
        const explanationMatch = aiResponse.match(/EXPLANATION:\s*([\s\S]*?)(?=CONFIDENCE:|$)/i);
        const explanation = explanationMatch ? explanationMatch[1].trim() : 'AI suggested a fix for better browser compatibility.';
        // Extract confidence
        const confidenceMatch = aiResponse.match(/CONFIDENCE:\s*(high|medium|low)/i);
        const confidence = (confidenceMatch ? confidenceMatch[1].toLowerCase() : 'medium');
        return {
            originalCode,
            suggestedCode,
            explanation,
            confidence,
            featureId: issue.featureId
        };
    }
}
//# sourceMappingURL=perplexity.js.map