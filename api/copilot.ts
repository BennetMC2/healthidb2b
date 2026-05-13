import { handleCopilotRequest } from '../server/copilot/handler';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  return handleCopilotRequest(request);
}
