import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// 定义 embeddings 响应的类型
interface EmbeddingsResponse {
    data: Array<{ chunk_text: string; [key: string]: any }>;
}

// 假设这是你的 getEmbeddings 接口
async function getEmbeddings(text: string): Promise<EmbeddingsResponse> {
    // 这里替换成你实际的 getEmbeddings 实现
    // 例如调用 OpenAI embeddings API 或其他向量化服务
    const response = await fetch('http://13.214.121.138/result/getEmbeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({userInput: text }),
    });

    if (!response.ok) {
        throw new Error(`Failed to get embeddings: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}

// 定义输出 schema
const embeddingsSchema = z.object({
    data: z.array(z.object({
        chunk_text: z.string(),
    }).passthrough()),
    userInput: z.string(),
});

const finalResponseSchema = z.object({
    result: z.string(),
    embeddingsCount: z.number(),
});

// 步骤1: 获取向量嵌入
const fetchEmbeddings = createStep({
    id: 'fetch-embeddings',
    description: 'Fetches embeddings for AWS Aurora using user input',
    inputSchema: z.object({
        userInput: z.string().describe('The user input to get embeddings for Aurora'),
    }),
    outputSchema: embeddingsSchema,
    execute: async ({ inputData }: { inputData: { userInput: string } }) => {
        try {
            const { userInput } = inputData;

            // 调用你的 getEmbeddings 接口
            const embeddings = await getEmbeddings(userInput);

            console.log(`Generated embeddings for input: ${userInput}`);
            console.log(`Embeddings data length: ${embeddings.data.length}`);

            return {
                data: embeddings.data,
                userInput
            };
        } catch (error) {
            console.error('Error fetching embeddings:', error);
            throw error;
        }
    },
});

// 步骤2: 使用向量和用户输入调用 agent.stream
const processWithAgent = createStep({
    id: 'process-with-agent',
    description: 'Process user input with embeddings using agent.stream',
    inputSchema: embeddingsSchema,
    outputSchema: finalResponseSchema,
    execute: async ({ inputData, mastra }: { inputData: { data: Array<{ chunk_text: string; [key: string]: any }>; userInput: string }; mastra?: any }) => {
        try {
            const {data, userInput} = inputData;

            // 获取你的 agent（替换为你实际的 agent 名称）
            const agent = mastra?.getAgent('clashAgent'); // 或者你的 agent 名称
            if (!agent) {
                throw new Error('Aurora agent not found');
            }
            let embeddings = data.map((item: { chunk_text: string; [key: string]: any }) => item.chunk_text).join('\n');

            // 组装提示词，包含向量信息和用户输入
            const prompt = `You are an experienced and professional network assistant specializing in generating accurate Clash proxy rules for users in mainland China.

You have the following context from the knowledge base (embeddings):
${embeddings}

The user question is:
${userInput}

Guidelines:
1. Rely solely on the above embeddings and the user's question for all decisions—do not use external knowledge or make assumptions.
2. When the user mentions a service, website, or app, check the context to determine if it is accessible from China or blocked by the GFW, and whether a proxy is required.
3. If a proxy is needed, output a Clash rule (e.g., DOMAIN-SUFFIX,example.com,proxy) with a one-sentence explanation in Chinese ("该网站在中国大陆无法访问，建议代理；规则如下…").
4. If direct access is possible, output the corresponding direct connection rule (e.g., DOMAIN-SUFFIX,example.com,direct) and explain.
5. If the context (embeddings) does not provide enough information, reply: "未在知识库找到该服务，请确认拼写或手动测试访问。"
6. For banking, government, or sensitive domains, **never** suggest using a proxy; always recommend direct connection and warn about safety and compliance.
7. If the user provides multiple domains, handle each separately.
8. Never output sensitive or illegal content.

Output format:
- Rule: DOMAIN-SUFFIX,example.com,proxy or DOMAIN-SUFFIX,example.com,direct
- Reason: [brief explanation]

Be accurate, safe, and concise at all times. If the user's question is in Chinese, your answer should also be in Chinese.`;

            // 使用 agent.stream 处理请求
            const response = await agent.stream([
                {
                    role: 'user',
                    content: prompt,
                },
            ]);

            // 处理流式响应
            let resultText = '';
            for await (const chunk of response.textStream) {
                process.stdout.write(chunk); // 实时输出
                resultText += chunk;
            }

            console.log('\n--- Agent processing completed ---');

            return {
                result: resultText,
                embeddingsCount: embeddings.length,
            };
        } catch (error) {
            console.error('Error processing with agent:', error);
            throw error;
        }
    },
});

// 创建工作流
const clashWorkflow = createWorkflow({
    id: 'clash-workflow',
    inputSchema: z.object({
        userInput: z.string().describe('The user input to get embeddings for Aurora and process with agent'),
    }),
    outputSchema: z.object({
        result: z.string(),
        embeddingsCount: z.number(),
    }),
})
    .then(fetchEmbeddings)
    .then(processWithAgent);

// 提交工作流
clashWorkflow.commit();

export { clashWorkflow };
