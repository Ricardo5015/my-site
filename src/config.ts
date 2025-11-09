import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

// ========== 网站基础配置 ==========

export const siteConfig: SiteConfig = {
	title: "年年四月菜花黄",  // 网站标题
	subtitle: "小雨的BLOG",  //网站副标题
	lang: "zh_CN", // 语言代码，例如: 'en'(英语), 'zh_CN'(简体中文), 'ja'(日语) 等

    // 主题颜色配置

	themeColor: {
		hue: 250, // 主题色调值，范围 0-360。例如: 红色=0, 青色=200, 蓝色=250, 粉色=345
		fixed: false, // 是否隐藏访客的主题颜色选择器。true=隐藏，false=显示
	},

    // 顶部横幅图片配置

	banner: {
		enable: false,  //是否启用横幅图片。true=显示，false=隐藏
		src: "assets/images/demo-banner.png", // 横幅图片路径。相对于 /src 目录。如果以 '/' 开头则相对于 /public 目录
		position: "center", // 图片位置，相当于 CSS 的 object-position。支持: 'top'(顶部), 'center'(居中), 'bottom'(底部)
		credit: {
			enable: false, // 是否显示图片版权信息
			text: "", // 版权信息文本
			url: "", // (可选) 原作品或作者页面的链接地址
		},
	},

    // 文章目录配置

	toc: {
		enable: true, // 是否在文章右侧显示目录。true=显示，false=隐藏
		depth: 2, // 目录最大显示的标题层级，范围 1-3。1=只显示 h1，2=显示 h1-h2，3=显示 h1-h3
	},

    // 网站图标(Favicon)配置

	favicon: [
		// 保持此数组为空以使用默认图标
		//自定义示例:
		// {
		//   src: '/favicon/icon.png',    //图标文件路径，相对于 /public 目录
		//   theme: 'light',              //图标文件路径，相对于 /public 目录
		//   sizes: '32x32',              // (可选) 图标尺寸，仅在有多个尺寸时设置
		// }
	],
};

// ========== 导航栏配置 ==========

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,       // 首页链接
		LinkPreset.Archive,    // 归档页链接
		LinkPreset.About,      // 关于页链接
		
		{
          name: "时间管理",
          url: "/time-management",
          external: false,
          }
		
		
		// 自定义链接示例:
		//{
		//	name: "GitHub",    // 链接显示的名称
		//	url: "https://github.com/saicaca/fuwari", // 链接地址。内部链接不需要包含 base path，会自动添加
		//	external: true, //是否为外部链接。true=显示外部链接图标并在新标签页打开
		//},
	],
};

// ========== 个人资料配置 ==========

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/Yu.png",   //头像图片路径。相对于 /src 目录。如果以 '/' 开头则相对于 /public 目录
	name: " Yu ",    // 显示的名字
	bio: " 读书不肯为人忙 ",    // 个人简介

	// 社交媒体链接列表
	links: [
		{
			name: "Twitter",   // 平台名称
			icon: "fa6-brands:twitter", // 图标代码，访问 https://icones.js.org/ 查找图标
			// // 如果图标集尚未安装，需要先安装对应的图标集:
			//运行命令: pnpm add @iconify-json/<图标集名称>
			url: "https://twitter.com",   // 社交媒体链接地址
		},
		{
			name: "Steam",
			icon: "fa6-brands:steam",
			url: "https://store.steampowered.com",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/saicaca/fuwari",
		},
	],
};

// ========== 版权许可配置 ==========

export const licenseConfig: LicenseConfig = {
	enable: true,   // 是否在文章底部显示版权许可信息
	name: "CC BY-NC-SA 4.0",    // 许可协议名称
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",    // 许可协议详情链接
};

// ========== 代码高亮配置 ==========

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	//  注意: 某些样式(如背景颜色)会被覆盖，详见 astro.config.mjs 文件
	// 请选择深色主题，因为当前博客主题仅支持深色背景
	theme: "github-dark",    // 代码块主题。可选: "github-dark", "dracula", "monokai" 等
};
