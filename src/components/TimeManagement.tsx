	import React, { useState, useEffect, useRef } from 'react';
	import { Calendar, Target, Sparkles, RotateCcw, Coffee, GripVertical, TouchPointer } from 'lucide-react';
	/**
	 * 时间管理日历组件 - "三天打鱼，一天晒网"规划工具
	 * 
	 * 功能说明：
	 * 1. 支持PC端拖拽和移动端触屏拖拽
	 * 2. 努力生活卡：连续3天，每天不同主题
	 * 3. 无敌摆烂卡：仅1天，用于休息
	 * 4. 支持月度切换和重置
	 */
	const TimeManagementCalendar = () => {
	  // ==================== 状态管理 ====================
	  /**
	   * 当前显示的月份
	   * 用于控制日历显示哪个月的日期
	   */
	  const [currentMonth, setCurrentMonth] = useState(new Date());
	  /**
	   * 主题配置数组
	   * 每个努力生活卡连续3天会依次使用这些主题
	   */
	  const [themes] = useState([
	    { name: '职业发展', color: 'from-blue-500 to-blue-600', icon: '💼', borderColor: 'border-blue-400' },
	    { name: '兴趣爱好', color: 'from-purple-500 to-purple-600', icon: '🎨', borderColor: 'border-purple-400' },
	    { name: '身心健康', color: 'from-green-500 to-green-600', icon: '💪', borderColor: 'border-green-400' }
	  ]);
	  /**
	   * 日历天数数组
	   * 每个元素代表一个日期格子，包含：
	   * - date: 日期数字（null表示空白格子）
	   * - type: 'work' | 'rest' | null（卡片类型）
	   * - themes: 主题索引数组（努力卡使用）
	   * - cardId: 卡片唯一标识（用于删除整张卡片）
	   */
	  const [calendarDays, setCalendarDays] = useState<any[]>([]);
	  /**
	   * 统计数据
	   * - work: 工作天数
	   * - rest: 休息天数  
	   * - total: 总天数
	   */
	  const [stats, setStats] = useState({ work: 0, rest: 0, total: 0 });
	  /**
	   * 拖拽相关状态
	   */
	  const [draggedCard, setDraggedCard] = useState<number | null>(null); // 正在拖拽的卡片索引
	  const [draggedCardType, setDraggedCardType] = useState<'work' | 'rest' | null>(null); // 拖拽的卡片类型
	  const [draggedTouch, setDraggedTouch] = useState<{ x: number; y: number; cardIndex: number; cardType: 'work' | 'rest' } | null>(null); // 移动端触屏拖拽状态
	  /**
	   * 卡片配置常量
	   */
	  const [availableWorkCards] = useState(7); // 总共可用的努力卡数量
	  const [availableRestCards] = useState(3); // 总共可用的摆烂卡数量
	  const [usedWorkCards, setUsedWorkCards] = useState(0); // 已使用的努力卡数量
	  const [usedRestCards, setUsedRestCards] = useState(0); // 已使用的摆烂卡数量
	  /**
	   * 庆祝动画显示控制
	   * 拖拽成功后显示emoji动画
	   */
	  const [showCelebration, setShowCelebration] = useState(false);
	  /**
	   * 移动端触屏提示
	   */
	  const [showTouchHint, setShowTouchHint] = useState(false);
	  const [isMobile, setIsMobile] = useState(false);
	  // 检测是否为移动设备
	  useEffect(() => {
	    const checkMobile = () => {
	      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
	    };
	    checkMobile();
	    window.addEventListener('resize', checkMobile);
	    return () => window.removeEventListener('resize', checkMobile);
	  }, []);
	  // ==================== 生命周期钩子 ====================
	  /**
	   * 组件初始化和月份切换时重新生成日历
	   * 依赖项：currentMonth（当月份变化时重新生成日历）
	   */
	  useEffect(() => {
	    generateCalendar();
	  }, [currentMonth]);
	  // ==================== 日历生成函数 ====================
	  /**
	   * 生成当前月份的日历数据
	   * 包括：
	   * 1. 计算月份第一天是周几
	   * 2. 计算月份有多少天
	   * 3. 在开头填充空白格子
	   * 4. 生成日期格子数组
	   */
	  const generateCalendar = () => {
	    const year = currentMonth.getFullYear();
	    const month = currentMonth.getMonth();
	    // 获取月份第一天（用于计算是周几）
	    const firstDay = new Date(year, month, 1);
	    // 获取月份最后一天（用于计算天数）
	    const lastDay = new Date(year, month + 1, 0);
	    const daysInMonth = lastDay.getDate();
	    // 第一天是周几（0=周日，1=周一...）
	    const startWeekday = firstDay.getDay();
	    const days = [];
	    // 在日历开头填充空白格子（对齐星期）
	    for (let i = 0; i < startWeekday; i++) {
	      days.push({ date: null, type: null, themes: [], cardId: null });
	    }
	    // 生成该月的所有日期格子
	    for (let date = 1; date <= daysInMonth; date++) {
	      days.push({ date, type: null, themes: [], cardId: null });
	    }
	    // 更新状态并计算统计信息
	    setCalendarDays(days);
	    updateStats(days);
	  };
	  /**
	   * 更新统计数据
	   * @param days 日历天数数组
	   * 计算工作天数、休息天数、已使用卡片数量等
	   */
	  const updateStats = (days: any[]) => {
	    // 统计工作天数（type为'work'的格子数量）
	    const workDays = days.filter(d => d.date && d.type === 'work').length;
	    // 统计休息天数（type为'rest'的格子数量）
	    const restDays = days.filter(d => d.date && d.type === 'rest').length;
	    // 统计总天数（有日期的格子数量）
	    const total = days.filter(d => d.date).length;
	    // 使用Set去重，统计实际使用的卡片数量（一张卡片可能占据多个格子）
	    const workCardsUsed = new Set(days.filter(d => d.cardId !== null && d.type === 'work').map(d => d.cardId)).size;
	    const restCardsUsed = new Set(days.filter(d => d.cardId !== null && d.type === 'rest').map(d => d.cardId)).size;
	    // 更新已使用卡片数量
	    setUsedWorkCards(workCardsUsed);
	    setUsedRestCards(restCardsUsed);
	    // 更新统计数据
	    setStats({ work: workDays, rest: restDays, total });
	  };
	  // ==================== 月份控制函数 ====================
	  /**
	   * 切换月份
	   * @param direction 方向：-1上个月，+1下个月
	   */
	  const changeMonth = (direction: number) => {
	    const newDate = new Date(currentMonth);
	    newDate.setMonth(newDate.getMonth() + direction);
	    setCurrentMonth(newDate);
	  };
	  // ==================== PC端拖拽处理函数 ====================
	  /**
	   * 开始拖拽时的处理（PC端）
	   * @param e 拖拽事件
	   * @param cardIndex 卡片索引
	   * @param cardType 卡片类型
	   */
	  const handleDragStart = (e: React.DragEvent, cardIndex: number, cardType: 'work' | 'rest') => {
	    if (isMobile) return; // 移动端不使用此方法
	    setDraggedCard(cardIndex);
	    setDraggedCardType(cardType);
	    e.dataTransfer.effectAllowed = 'copy';
	    // 创建拖拽时的视觉反馈
	    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
	    dragImage.style.opacity = '0.8';
	    dragImage.style.transform = 'scale(0.9)';
	    dragImage.style.position = 'absolute';
	    dragImage.style.top = '-1000px';
	    document.body.appendChild(dragImage);
	    e.dataTransfer.setDragImage(dragImage, 20, 20);
	    setTimeout(() => {
	      if (document.body.contains(dragImage)) {
	        document.body.removeChild(dragImage);
	      }
	    }, 0);
	  };
	  /**
	   * 拖拽经过时的处理（PC端）
	   * @param e 拖拽事件
	   */
	  const handleDragOver = (e: React.DragEvent) => {
	    if (isMobile) return; // 移动端不使用此方法
	    e.preventDefault();
	    e.dataTransfer.dropEffect = 'copy';
	  };
	  /**
	   * 放置卡片时的处理（PC端）
	   * @param e 拖拽事件
	   * @param startIndex 放置起始位置的索引
	   */
	  const handleDrop = (e: React.DragEvent, startIndex: number) => {
	    if (isMobile) return; // 移动端不使用此方法
	    e.preventDefault();
	    handleCardDrop(startIndex, draggedCard, draggedCardType);
	  };
	  // ==================== 移动端触屏处理函数 ====================
	  /**
	   * 触摸开始（移动端）
	   * @param e 触摸事件
	   * @param cardIndex 卡片索引
	   * @param cardType 卡片类型
	   */
	  const handleTouchStart = (e: React.TouchEvent, cardIndex: number, cardType: 'work' | 'rest') => {
	    if (!isMobile) return; // PC端不使用此方法
	    const touch = e.touches[0];
	    const card = e.currentTarget;
	    // 检查卡片是否已使用
	    const isUsed = (cardType === 'work' && cardIndex >= usedWorkCards) || 
	                   (cardType === 'rest' && cardIndex >= usedRestCards);
	    if (isUsed) return;
	    setDraggedTouch({
	      x: touch.clientX,
	      y: touch.clientY,
	      cardIndex,
	      cardType
	    });
	    // 添加拖拽样式
	    card.style.position = 'fixed';
	    card.style.zIndex = '1000';
	    card.style.opacity = '0.8';
	    card.style.transform = 'scale(1.1)';
	    card.style.pointerEvents = 'none';
	    // 显示提示
	    setShowTouchHint(true);
	  };
	  /**
	   * 触摸移动（移动端）
	   * @param e 触摸事件
	   */
	  const handleTouchMove = (e: React.TouchEvent) => {
	    if (!isMobile || !draggedTouch) return;
	    const touch = e.touches[0];
	    const deltaX = touch.clientX - draggedTouch.x;
	    const deltaY = touch.clientY - draggedTouch.y;
	    // 移动卡片视觉反馈
	    const cards = document.querySelectorAll('.mobile-draggable');
	    cards.forEach(card => {
	      if ((card as HTMLElement).dataset.cardIndex === draggedTouch.cardIndex.toString() && 
	          (card as HTMLElement).dataset.cardType === draggedTouch.cardType) {
	        (card as HTMLElement).style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.1)`;
	      }
	    });
	  };
	  /**
	   * 触摸结束（移动端）
	   * @param e 触摸事件
	   * @param startIndex 放置位置索引
	   */
	  const handleTouchEnd = (e: React.TouchEvent, startIndex: number) => {
	    if (!isMobile || !draggedTouch) return;
	    e.preventDefault();
	    // 重置所有卡片样式
	    const cards = document.querySelectorAll('.mobile-draggable');
	    cards.forEach(card => {
	      (card as HTMLElement).style.position = '';
	      (card as HTMLElement).style.zIndex = '';
	      (card as HTMLElement).style.opacity = '';
	      (card as HTMLElement).style.transform = '';
	      (card as HTMLElement).style.pointerEvents = '';
	    });
	    // 处理放置
	    handleCardDrop(startIndex, draggedTouch.cardIndex, draggedTouch.cardType);
	    // 清理状态
	    setDraggedTouch(null);
	    setShowTouchHint(false);
	  };
	  /**
	   * 统一的卡片放置处理函数
	   * @param startIndex 放置位置索引
	   * @param cardIndex 卡片索引
	   * @param cardType 卡片类型
	   */
	  const handleCardDrop = (startIndex: number, cardIndex: number | null, cardType: 'work' | 'rest' | null) => {
	    if (cardIndex === null || cardType === null) return;
	    // 获取目标日期格子
	    const day = calendarDays[startIndex];
	    if (!day.date) return; // 空白格子不能放置
	    const newDays = [...calendarDays];
	    const cardId = Date.now(); // 生成唯一ID
	    const cardLength = cardType === 'work' ? 3 : 1; // 摆烂卡只占据1天
	    // 检查是否还有可用卡片
	    if (cardType === 'work' && usedWorkCards >= availableWorkCards) {
	      alert('努力生活卡已经用完啦！🎴');
	      resetDrag();
	      return;
	    }
	    if (cardType === 'rest' && usedRestCards >= availableRestCards) {
	      alert('无敌摆烂卡已经用完啦！😴');
	      resetDrag();
	      return;
	    }
	    // 检查是否能放置连续的天数
	    let canPlace = true;
	    for (let i = 0; i < cardLength; i++) {
	      const targetIndex = startIndex + i;
	      // 超出日历范围
	      if (targetIndex >= newDays.length || !newDays[targetIndex].date) {
	        canPlace = false;
	        break;
	      }
	      // 检查是否跨周（周日是0，不能跨越周日）
	      if (i > 0 && (startIndex + i) % 7 === 0) {
	        canPlace = false;
	        break;
	      }
	    }
	    if (!canPlace) {
	      alert(`这里放不下完整的${cardLength}天卡片哦！请选择其他位置 🗓️`);
	      resetDrag();
	      return;
	    }
	    // 执行放置操作
	    if (cardType === 'work') {
	      // 放置努力生活卡（连续3天，每天不同主题）
	      for (let i = 0; i < 3; i++) {
	        const targetIndex = startIndex + i;
	        newDays[targetIndex].themes = [i]; // 使用第i个主题
	        newDays[targetIndex].cardId = cardId; // 设置卡片ID
	        newDays[targetIndex].type = 'work'; // 设置类型
	      }
	    } else {
	      // 放置无敌摆烂卡（仅1天）
	      newDays[startIndex].themes = []; // 摆烂卡没有主题
	      newDays[startIndex].cardId = cardId; // 设置卡片ID
	      newDays[startIndex].type = 'rest'; // 设置类型
	    }
	    // 更新状态
	    setCalendarDays(newDays);
	    updateStats(newDays);
	    resetDrag(); // 重置拖拽状态
	    // 显示庆祝动画
	    setShowCelebration(true);
	    setTimeout(() => setShowCelebration(false), 1500);
	  };
	  /**
	   * 重置拖拽状态
	   */
	  const resetDrag = () => {
	    setDraggedCard(null);
	    setDraggedCardType(null);
	    setDraggedTouch(null);
	    setShowTouchHint(false);
	  };
	  // ==================== 卡片操作函数 ====================
	  /**
	   * 移除已放置的卡片
	   * @param cardId 要移除的卡片ID
	   */
	  const removeCard = (cardId: number) => {
	    const newDays = calendarDays.map(day => {
	      if (day.cardId === cardId) {
	        return { ...day, themes: [], cardId: null, type: null };
	      }
	      return day;
	    });
	    setCalendarDays(newDays);
	    updateStats(newDays);
	  };
	  /**
	   * 重置整个日历
	   */
	  const resetCalendar = () => {
	    if (confirm('确定要重置本月的所有安排吗？')) {
	      generateCalendar();
	    }
	  };
	  // ==================== 数据计算 ====================
	  // 星期标题数组
	  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
	  /**
	   * 获取所有已使用的卡片ID列表
	   */
	  const usedWorkCardIds = [...new Set(
	    calendarDays
	      .filter(d => d.cardId !== null && d.type === 'work')
	      .map(d => d.cardId)
	  )];
	  const usedRestCardIds = [...new Set(
	    calendarDays
	      .filter(d => d.cardId !== null && d.type === 'rest')
	      .map(d => d.cardId)
	  )];
	  // ==================== JSX渲染 ====================
	  return (
	    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-2 sm:p-4">
	      <div className="max-w-7xl mx-auto">
	        {/* 标题区域 */}
	        <div className="text-center mb-4 sm:mb-6">
	          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
	            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 animate-pulse" />
	            三天打鱼，一天晒网
	            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 animate-pulse" />
	          </h1>
	          <p className="text-gray-300 text-xs sm:text-sm">
	            {isMobile ? '👆 长按卡片，再点击日期' : '拖拽卡片'}来规划你的努力生活 🎴
	          </p>
	        </div>
	        {/* 主布局：移动端上下，PC端左右 */}
	        <div className={`flex gap-4 ${isMobile ? 'flex-col' : 'flex-col lg:flex-row'}`}>
	          {/* 左侧：控制面板 */}
	          <div className={`${isMobile ? 'w-full' : 'lg:w-80'} space-y-4`}>
	            {/* 统计信息面板 */}
	            <div className="grid grid-cols-2 gap-3">
	              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-3 border border-white/20">
	                <div className="text-blue-300 text-xs mb-1">努力卡片</div>
	                <div className="text-lg sm:text-xl font-bold text-white">{usedWorkCards} / {availableWorkCards}</div>
	              </div>
	              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-3 border border-white/20">
	                <div className="text-pink-300 text-xs mb-1">摆烂卡片</div>
	                <div className="text-lg sm:text-xl font-bold text-white">{usedRestCards} / {availableRestCards}</div>
	              </div>
	            </div>
	            {/* 努力生活卡面板 */}
	            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-3 sm:p-4 border border-white/20">
	              <div className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
	                🎴 努力生活卡
	                <span className="text-xs bg-blue-500/30 px-2 py-0.5 rounded">
	                  连续3天
	                </span>
	              </div>
	              {/* 努力生活卡网格 */}
	              <div className="grid grid-cols-4 gap-2 mb-3">
	                {[...Array(availableWorkCards)].map((_, index) => {
	                  const isUsed = index < usedWorkCards;
	                  return (
	                    <div
	                      key={index}
	                      draggable={!isUsed && !isMobile}
	                      onDragStart={(e) => !isUsed && !isMobile && handleDragStart(e, index, 'work')}
	                      onTouchStart={(e) => !isUsed && isMobile && handleTouchStart(e, index, 'work')}
	                      className={`
	                        mobile-draggable relative group
	                        ${isUsed ? 'opacity-30 cursor-not-allowed' : isMobile ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}
	                      `}
	                      data-card-index={index}
	                      data-card-type="work"
	                    >
	                      <div className={`
	                        bg-gradient-to-br from-amber-400 via-orange-500 to-red-500
	                        rounded p-1.5 sm:p-2 border border-amber-300
	                        shadow transition-all duration-300
	                        ${!isUsed ? 'hover:scale-105 hover:shadow-lg active:scale-95' : ''}
	                      `}>
	                        <div className="text-center">
	                          <span className="text-white font-bold text-xs">#{index + 1}</span>
	                          {isUsed && <div className="text-[8px] text-white/80">已用</div>}
	                        </div>
	                        {!isUsed && (
	                          <div className="mt-1 space-y-0.5">
	                            {themes.slice(0, 3).map((theme, i) => (
	                              <div key={i} className="text-center">
	                                <span className="text-xs">{theme.icon}</span>
	                              </div>
	                            ))}
	                          </div>
	                        )}
	                      </div>
	                    </div>
	                  );
	                })}
	              </div>
	              {/* 已使用的努力卡列表 */}
	              {usedWorkCardIds.length > 0 && (
	                <div className="pt-3 border-t border-white/10">
	                  <div className="text-white text-xs mb-2">已使用：</div>
	                  <div className="flex flex-wrap gap-1">
	                    {usedWorkCardIds.map((cardId, index) => (
	                      <button
	                        key={cardId}
	                        onClick={() => removeCard(cardId as number)}
	                        className="bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 px-2 py-1 rounded text-white text-xs transition-all"
	                      >
	                        #{index + 1} ×
	                      </button>
	                    ))}
	                  </div>
	                </div>
	              )}
	            </div>
	            {/* 无敌摆烂卡面板 */}
	            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-3 sm:p-4 border border-white/20">
	              <div className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
	                😴 无敌摆烂卡
	                <span className="text-xs bg-pink-500/30 px-2 py-0.5 rounded">
	                  1天
	                </span>
	              </div>
	              {/* 摆烂卡网格 */}
	              <div className="grid grid-cols-3 gap-2 mb-3">
	                {[...Array(availableRestCards)].map((_, index) => {
	                  const isUsed = index < usedRestCards;
	                  return (
	                    <div
	                      key={index}
	                      draggable={!isUsed && !isMobile}
	                      onDragStart={(e) => !isUsed && !isMobile && handleDragStart(e, index, 'rest')}
	                      onTouchStart={(e) => !isUsed && isMobile && handleTouchStart(e, index, 'rest')}
	                      className={`
	                        mobile-draggable relative group
	                        ${isUsed ? 'opacity-30 cursor-not-allowed' : isMobile ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}
	                      `}
	                      data-card-index={index}
	                      data-card-type="rest"
	                    >
	                      <div className={`
	                        bg-gradient-to-br from-pink-400 via-rose-400 to-red-400
	                        rounded p-2 sm:p-3 border border-pink-300
	                        shadow transition-all duration-300
	                        ${!isUsed ? 'hover:scale-105 hover:shadow-lg active:scale-95' : ''}
	                      `}>
	                        <div className="text-center">
	                          <span className="text-white font-bold text-xs">#{index + 1}</span>
	                          {isUsed && <div className="text-[8px] text-white/80">已用</div>}
	                        </div>
	                        {!isUsed && (
	                          <div className="mt-1 text-center">
	                            <span className="text-base sm:text-lg">😴</span>
	                          </div>
	                        )}
	                      </div>
	                    </div>
	                  );
	                })}
	              </div>
	              {/* 已使用的摆烂卡列表 */}
	              {usedRestCardIds.length > 0 && (
	                <div className="pt-3 border-t border-white/10">
	                  <div className="text-white text-xs mb-2">已使用：</div>
	                  <div className="flex flex-wrap gap-1">
	                    {usedRestCardIds.map((cardId, index) => (
	                      <button
	                        key={cardId}
	                        onClick={() => removeCard(cardId as number)}
	                        className="bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 px-2 py-1 rounded text-white text-xs transition-all"
	                      >
	                        #{index + 1} ×
	                      </button>
	                    ))}
	                  </div>
	                </div>
	              )}
	            </div>
	            {/* 使用说明面板 */}
	            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-lg rounded-lg p-3 border border-yellow-500/30">
	              <div className="text-yellow-300 font-semibold mb-2 flex items-center gap-2 text-sm">
	                💡 使用说明
	              </div>
	              <ul className="text-yellow-200 text-xs space-y-1">
	                <li>• {isMobile ? '👆 长按卡片，再点击日期' : '拖拽卡片到日历'}</li>
	                <li>• 努力卡3天，摆烂卡1天</li>
	                <li>• 点击"已使用"可移除卡片</li>
	              </ul>
	            </div>
	          </div>
	          {/* 右侧：日历主体 */}
	          <div className="flex-1">
	            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 sm:p-4 md:p-6 border border-white/20">
	              {/* 月份切换控制 */}
	              <div className="flex items-center justify-between mb-3 sm:mb-4">
	                <button
	                  onClick={() => changeMonth(-1)}
	                  className="px-3 py-1.5 sm:px-3 sm:py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all font-medium text-sm"
	                >
	                  ← 上月
	                </button>
	                <div className="text-center">
	                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
	                    {currentMonth.getFullYear()} 年 {currentMonth.getMonth() + 1} 月
	                  </h2>
	                  <button
	                    onClick={resetCalendar}
	                    className="text-xs bg-red-500/20 hover:bg-red-500/30 px-2 py-1 rounded transition-all flex items-center gap-1 mx-auto text-white"
	                  >
	                    <RotateCcw className="w-3 h-3" />
	                    重置
	                  </button>
	                </div>
	                <button
	                  onClick={() => changeMonth(1)}
	                  className="px-3 py-1.5 sm:px-3 sm:py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all font-medium text-sm"
	                >
	                  下月 →
	                </button>
	              </div>
	              {/* 星期标题行 */}
	              <div className="grid grid-cols-7 gap-1 mb-2">
	                {weekDays.map(day => (
	                  <div key={day} className="text-center text-gray-300 font-bold py-1 text-xs sm:text-sm">
	                    {day}
	                  </div>
	                ))}
	              </div>
	              {/* 日期格子网格 */}
	              <div className="grid grid-cols-7 gap-1">
	                {calendarDays.map((day, index) => {
	                  const hasCard = day.cardId !== null;
	                  const themeIndex = day.themes[0];
	                  const isWorkDay = day.type === 'work';
	                  const isRestDay = day.type === 'rest';
	                  return (
	                    <div
	                      key={index}
	                      onDragOver={!isMobile ? handleDragOver : undefined}
	                      onDrop={!isMobile ? (e) => handleDrop(e, index) : undefined}
	                      onTouchEnd={isMobile && draggedTouch ? (e) => handleTouchEnd(e, index) : undefined}
	                      className={`
	                        aspect-square rounded-lg flex flex-col items-center justify-center
	                        transition-all duration-300 relative group
	                        ${!day.date ? 'invisible' : ''}
	                        ${isWorkDay && themeIndex !== undefined
	                          ? `bg-gradient-to-br ${themes[themeIndex].color} shadow-lg border ${themes[themeIndex].borderColor}`
	                          : isRestDay
	                          ? 'bg-gradient-to-br from-pink-400 to-rose-500 shadow-lg border border-pink-300'
	                          : 'bg-white/5 border border-dashed border-white/20 hover:border-white/50 hover:bg-white/10'
	                        }
	                        ${isMobile && draggedTouch ? 'cursor-pointer' : ''}
	                      `}
	                    >
	                      {day.date && (
	                        <>
	                          <span className={`font-bold text-xs sm:text-sm ${hasCard ? 'text-white' : 'text-gray-400'}`}>
	                            {day.date}
	                          </span>
	                          {isWorkDay && themeIndex !== undefined && (
	                            <div className="mt-0.5 flex flex-col items-center">
	                              <span className="text-sm sm:text-lg">{themes[themeIndex].icon}</span>
	                              <span className="text-[6px] sm:text-[8px] text-white/90 mt-0.5 font-medium leading-tight">
	                                {themes[themeIndex].name}
	                              </span>
	                            </div>
	                          )}
	                          {isRestDay && (
	                            <div className="mt-0.5 flex flex-col items-center">
	                              <span className="text-sm sm:text-lg">😴</span>
	                              <span className="text-[6px] sm:text-[8px] text-white/90 mt-0.5 font-medium">
	                                摆烂日
	                              </span>
	                            </div>
	                          )}
	                          {/* 拖拽提示 */}
	                          {!hasCard && ((isMobile && draggedTouch) || (!isMobile && draggedCard !== null)) && (
	                            <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 rounded-lg backdrop-blur-sm">
	                              <span className="text-white text-xs font-medium">放这里</span>
	                            </div>
	                          )}
	                        </>
	                      )}
	                    </div>
	                  );
	                })}
	              </div>
	            </div>
	            {/* 完成率统计面板 */}
	            <div className="mt-3 sm:mt-4 bg-white/10 backdrop-blur-lg rounded-lg p-3 sm:p-4 border border-white/20">
	              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
	                <div>
	                  <div className="text-green-300 text-xs sm:text-sm">努力天数</div>
	                  <div className="text-lg sm:text-2xl font-bold text-white">{stats.work} 天</div>
	                </div>
	                <div>
	                  <div className="text-pink-300 text-xs sm:text-sm">休息天数</div>
	                  <div className="text-lg sm:text-2xl font-bold text-white">{stats.rest} 天</div>
	                </div>
	                <div>
	                  <div className="text-purple-300 text-xs sm:text-sm">完成率</div>
	                  <div className="text-lg sm:text-2xl font-bold text-white">
	                    {stats.total > 0 ? Math.round((stats.work / stats.total) * 100) : 0}%
	                  </div>
	                </div>
	              </div>
	            </div>
	          </div>
	        </div>
	        {/* 移动端触屏提示 */}
	        {showTouchHint && isMobile && (
	          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-lg z-50 text-sm">
	            👆 现在点击日历上的日期来放置卡片
	          </div>
	        )}
	        {/* 庆祝动画层 */}
	        {showCelebration && (
	          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
	            <div className="text-4xl sm:text-6xl md:text-8xl animate-bounce">
	              {draggedCardType === 'work' || draggedTouch?.cardType === 'work' ? '🎉' : '😴'}
	            </div>
	          </div>
	        )}
	      </div>
	    </div>
	  );
	};
	export default TimeManagementCalendar;