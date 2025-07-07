import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// 创建一个工具，将工作流包装为工具
const clashWorkflowTool = createTool({
    id: 'clash-workflow-tool',
    description: 'Generate Clash proxy.cjs rules based on user input using embeddings and knowledge base',
    inputSchema: z.object({
        userInput: z.string().describe('The user input to generate Clash proxy.cjs rules for'),
    }),
    outputSchema: z.object({
        result: z.string(),
        embeddingsCount: z.number(),
    }),
    execute: async ({ context: { userInput }, mastra }) => {
        if (!mastra) {
            throw new Error('Mastra instance not available');
        }

        const workflow = mastra.getWorkflow('clashWorkflow');
        if (!workflow) {
            throw new Error('Clash workflow not found');
        }

        const run = await workflow.createRunAsync();
        const result = await run.start({
            inputData: { userInput },
        });
        console.log(result);
        if (result.status === 'success') {
            return result.result;
        } else{
            return
        }
    },
});

export {clashWorkflowTool}
