export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// 创建要返回的数据对象
		const data = {
			timestamp: Date.now(),
			randomData: Math.random() * 100,
			message: `数据更新于 ${new Date().toLocaleTimeString()}`,
			memory: 'CloudFlare Serverless API Test, 2024年10月23日 12:19 pm, 悉尼UTS library level 7, 悉尼前端之神Fzgt',
		};

		// 返回 JSON 响应
		return new Response(
			JSON.stringify(data),  // 将对象转换为 JSON 字符串
			{
				headers: {
					'Content-Type': 'application/json',  // 设置内容类型为 JSON
					'Access-Control-Allow-Origin': '*',  // 允许跨域访问
					'Cache-Control': 'public, max-age=180'  // 设置缓存时间为3分钟
				}
			}
		);
	}
} satisfies ExportedHandler<Env>;