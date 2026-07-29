import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const defaultFoods = [
  { name: '沙县小吃', color: '#B7E6C9' },
  { name: '小狗面馆 / 拉面', color: '#FF8B83' },
  { name: '潮汕粿条汤', color: '#F4D99F' },
  { name: '黄焖鸡米饭', color: '#CDA8D9' },
  { name: 'KFC', color: '#A8EAB6' },
  { name: '麦当劳', color: '#7FA5F7' },
  { name: '自选菜 · 1荤', color: '#F5D79A' },
  { name: '番茄鸡蛋面', color: '#D1B5F4' },
]

function getDayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftDayKey(offset) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return getDayKey(date)
}

function formatHistoryDate(dayKey) {
  if (dayKey === getDayKey()) return '今天 · 手动'
  if (dayKey === shiftDayKey(-1)) return '昨天 · 手动'
  const date = new Date(`${dayKey}T12:00:00`)
  return `${date.getMonth() + 1}月${date.getDate()}日 · 手动`
}

function normalizeHistory(items) {
  return items.map((item) => ({
    ...item,
    dayKey: item.dayKey || (item.date?.includes('昨天') ? shiftDayKey(-1) : getDayKey()),
  }))
}

const seedHistory = [
  { name: '潮汕粿条汤', date: '今天 · 午餐', time: '12:18', note: '清爽一点', dayKey: getDayKey() },
  { name: '麦当劳', date: '昨天 · 晚餐', time: '18:42', note: '想吃点快乐的', dayKey: shiftDayKey(-1) },
  { name: '沙县小吃', date: '周日 · 午餐', time: '12:06', note: '快速解决', dayKey: shiftDayKey(-2) },
  { name: '黄焖鸡米饭', date: '周六 · 晚餐', time: '18:27', note: '热乎乎', dayKey: shiftDayKey(-3) },
]

const iconPaths = {
  spark: <><path d="m12 2 1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3.2 2"/></>,
  bowl: <><path d="M4 11h16"/><path d="M5 11c.4 5 2.5 8 7 8s6.6-3 7-8"/><path d="M8 7c.4-1.6 1.7-2.5 3.2-2.5M12.5 4.5c1-.8 2.1-1 3.2-.4"/></>,
  list: <><path d="M5 5h14M5 12h14M5 19h14"/><path d="M2.5 5h.01M2.5 12h.01M2.5 19h.01"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  chevron: <path d="m8 10 4 4 4-4"/>,
}

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>
}

function polarToCartesian(cx, cy, radius, angle) {
  const radians = ((angle - 90) * Math.PI) / 180
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) }
}

function describeArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return [`M ${cx} ${cy}`, `L ${start.x} ${start.y}`, `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, 'Z'].join(' ')
}

function Wheel({ foods, rotation, isSpinning }) {
  const segment = 360 / Math.max(foods.length, 1)
  return (
    <div className={`wheel-wrap ${isSpinning ? 'is-spinning' : ''}`}>
      <div className="wheel-pointer" aria-hidden="true"><span /></div>
      <svg className="wheel" viewBox="0 0 500 500" style={{ transform: `rotate(${rotation}deg)` }} role="img" aria-label="今天吃什么转盘">
        <circle cx="250" cy="250" r="240" fill="#fffaf3" stroke="#26282d" strokeWidth="2" />
        {foods.map((food, index) => {
          const start = index * segment
          const mid = start + segment / 2
          const labelPoint = polarToCartesian(250, 250, 155, mid)
          const shouldRotate = mid > 90 && mid < 270
          const labelRotation = shouldRotate ? mid + 180 : mid
          return (
            <g key={`${food.name}-${index}`}>
              <path d={describeArc(250, 250, 238, start, start + segment)} fill={food.color} stroke="#26282d" strokeOpacity=".13" strokeWidth="1.5" />
              <text x={labelPoint.x} y={labelPoint.y} transform={`rotate(${labelRotation} ${labelPoint.x} ${labelPoint.y})`} textAnchor="middle" dominantBaseline="middle" className="wheel-label">{food.name}</text>
            </g>
          )
        })}
        <circle cx="250" cy="250" r="44" fill="#fffdf9" stroke="#26282d" strokeWidth="2" />
        <circle cx="250" cy="250" r="10" fill="#26282d" />
      </svg>
    </div>
  )
}

function App() {
  const [foods, setFoods] = useState(() => {
    try { return JSON.parse(localStorage.getItem('today-eat-foods')) || defaultFoods } catch { return defaultFoods }
  })
  const [history, setHistory] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('today-eat-history'))
      return normalizeHistory(stored || seedHistory)
    } catch { return seedHistory }
  })
  const [rotation, setRotation] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [newFood, setNewFood] = useState('')
  const [activeNav, setActiveNav] = useState('wheel')
  const [isAddingHistory, setIsAddingHistory] = useState(false)
  const [manualFoodName, setManualFoodName] = useState('')
  const [manualFoodDate, setManualFoodDate] = useState(getDayKey())
  const [manualFoodNote, setManualFoodNote] = useState('')

  useEffect(() => localStorage.setItem('today-eat-foods', JSON.stringify(foods)), [foods])
  useEffect(() => localStorage.setItem('today-eat-history', JSON.stringify(history)), [history])

  const selectedFood = foods[selectedIndex]?.name || '准备好了吗？'
  const today = useMemo(() => new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date()), [])
  const yesterdayFoodNames = useMemo(() => new Set(history.filter((item) => item.dayKey === shiftDayKey(-1)).map((item) => item.name.trim())), [history])
  const yesterdayFoods = foods.filter((food) => yesterdayFoodNames.has(food.name.trim()))
  const availableFoodCount = foods.length - yesterdayFoods.length

  const spin = () => {
    if (isSpinning || availableFoodCount === 0) return
    const eligibleFoods = foods.map((food, index) => ({ food, index })).filter(({ food }) => !yesterdayFoodNames.has(food.name.trim()))
    const nextIndex = eligibleFoods[Math.floor(Math.random() * eligibleFoods.length)].index
    const segment = 360 / foods.length
    const target = -(nextIndex * segment + segment / 2)
    const normalized = ((rotation % 360) + 360) % 360
    const currentTarget = ((target % 360) + 360) % 360
    let delta = currentTarget - normalized
    if (delta > 0) delta -= 360
    setIsSpinning(true)
    setRotation(rotation + 1440 + delta)
    window.setTimeout(() => {
      setSelectedIndex(nextIndex)
      setIsSpinning(false)
      setHistory((items) => [{ name: foods[nextIndex].name, date: '今天 · 随机', time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), note: '转盘选出', dayKey: getDayKey() }, ...items].slice(0, 12))
    }, 2300)
  }

  const reset = () => {
    setRotation(0)
    setSelectedIndex(0)
    setIsSpinning(false)
  }

  const addFood = (event) => {
    event.preventDefault()
    const name = newFood.trim()
    if (!name || foods.some((item) => item.name === name)) return
    const palette = ['#B7E6C9', '#FF8B83', '#F4D99F', '#CDA8D9', '#A8EAB6', '#7FA5F7']
    setFoods((items) => [...items, { name, color: palette[items.length % palette.length] }])
    setNewFood('')
  }

  const updateFoodName = (index, value) => {
    setFoods((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, name: value } : item))
  }

  const commitFoodName = (index) => {
    setFoods((items) => {
      const current = items[index]?.name.trim()
      if (!current) return items.map((item, itemIndex) => itemIndex === index ? { ...item, name: `未命名菜品${itemIndex + 1}` } : item)
      const duplicate = items.some((item, itemIndex) => itemIndex !== index && item.name.trim() === current)
      if (duplicate) return items
      return items.map((item, itemIndex) => itemIndex === index ? { ...item, name: current } : item)
    })
  }

  const removeFood = (index) => {
    if (foods.length <= 2) return
    setFoods((items) => items.filter((_, itemIndex) => itemIndex !== index))
    setSelectedIndex(0)
  }

  const removeHistoryItem = (index) => {
    setHistory((items) => items.filter((_, itemIndex) => itemIndex !== index))
  }

  const addHistoryRecord = (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const name = form.elements.namedItem('foodName')?.value.trim() || ''
    const dayKey = form.elements.namedItem('foodDate')?.value || getDayKey()
    const note = form.elements.namedItem('foodNote')?.value.trim() || '手动记录'
    if (!name) return
    setHistory((items) => [{ name, date: formatHistoryDate(dayKey), time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), note, dayKey }, ...items].slice(0, 12))
    setManualFoodName('')
    setManualFoodNote('')
    setManualFoodDate(getDayKey())
    setIsAddingHistory(false)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Icon name="bowl" size={22} /></div><div><strong>食 · 记</strong><span>MEAL PICKER</span></div></div>
        <div className="side-label">我的空间</div>
        <nav className="side-nav" aria-label="主导航">
          <button className={activeNav === 'wheel' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav('wheel')}><Icon name="spark" /><span>今天转盘</span><small>01</small></button>
          <button className={activeNav === 'history' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav('history')}><Icon name="history" /><span>历史记录</span><small>{history.length.toString().padStart(2, '0')}</small></button>
          <button className={activeNav === 'foods' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveNav('foods'); setIsEditing(true) }}><Icon name="list" /><span>菜品管理</span><small>{foods.length.toString().padStart(2, '0')}</small></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="tip-card"><span className="tip-kicker">小提示</span><p>选择困难的时候，就交给一点点运气吧。</p><div className="tip-spark">✦</div></div>
          <div className="profile"><div className="avatar">你</div><div><strong>今天也要好好吃饭</strong><span>本地数据已保存</span></div><Icon name="chevron" size={16} /></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumb"><span>我的空间</span><i>/</i><strong>{activeNav === 'wheel' ? '今天转盘' : activeNav === 'history' ? '历史记录' : '菜品管理'}</strong></div><div className="topbar-actions"><span className="date-chip"><span className="status-dot" />{today}</span><button className="icon-btn" aria-label="打开设置"><span>•••</span></button></div></header>

        <section className="intro-row">
          <div><p className="eyebrow">A LITTLE DECISION, A LOT OF JOY</p><h1>今天吃什么？</h1><p className="intro-copy">不用纠结太久，把选择交给转盘，安心等一顿好饭。</p></div>
          <div className="intro-result"><span>今日推荐</span><strong>{selectedFood}</strong><small>{isSpinning ? '正在为你认真挑选…' : '准备好就开始吧'}</small></div>
        </section>

        <section className="workspace-grid" aria-label="转盘与控制台">
          <div className="wheel-card">
            <div className="card-heading"><div><span className="section-label">DECISION WHEEL</span><h2>把选择交给今天的好运</h2></div><button className="text-button" onClick={reset}><Icon name="history" size={15} />重新开始</button></div>
            <Wheel foods={foods} rotation={rotation} isSpinning={isSpinning} />
            <div className="wheel-footer"><div className="wheel-legend"><span><i className="legend-dot mint" />{availableFoodCount} 个今日选项</span><span><i className="legend-dot ink" />自动避开昨日</span></div><span className="wheel-hint">{yesterdayFoods.length > 0 ? `昨天已吃 ${yesterdayFoods.length} 项，今天暂时跳过` : '按空格键也可以开始'}</span></div>
          </div>

          <aside className="control-column">
            <div className="action-card">
              <div className="action-top"><span className="section-label">READY WHEN YOU ARE</span><span className="mini-status"><i />本地运行</span></div>
              <div className="action-copy"><span className="action-icon"><Icon name="spark" size={21} /></span><div><strong>{isSpinning ? '正在旋转…' : '现在就决定'}</strong><p>{isSpinning ? '再等一会儿，好吃的马上出现' : availableFoodCount === 0 ? '昨天吃过了全部选项，先添加一道新的吧' : yesterdayFoods.length > 0 ? `已自动跳过昨天吃过的 ${yesterdayFoods.length} 项` : '今天的晚餐，让好运来安排'}</p></div></div>
              <button className="primary-button" onClick={spin} disabled={isSpinning || availableFoodCount === 0}>{isSpinning ? '转盘中…' : availableFoodCount === 0 ? '请先添加新菜品' : '开始转盘'}<span>↗</span></button>
              <button className="secondary-button" onClick={reset}>重置转盘</button>
            </div>
            <div className={`food-card ${isEditing ? 'editing' : ''}`}>
              <div className="card-heading compact"><div><span className="section-label">YOUR MENU</span><h3>我的菜品</h3></div><button className="circle-button" onClick={() => setIsEditing((value) => !value)} aria-label={isEditing ? '关闭编辑' : '编辑菜品'}>{isEditing ? <Icon name="close" size={17} /> : <Icon name="plus" size={17} />}</button></div>
              {isEditing && <form className="add-form" onSubmit={addFood}><input value={newFood} onChange={(event) => setNewFood(event.target.value)} placeholder="输入一道想吃的…" aria-label="新菜品名称" /><button type="submit" aria-label="添加菜品"><Icon name="plus" size={17} /></button></form>}
              <div className="food-list">{foods.map((food, index) => <div className={`food-row ${index === selectedIndex ? 'selected' : ''}`} key={`${index}-${food.color}`}><span className="food-color" style={{ backgroundColor: food.color }} />{isEditing ? <input className="food-input" value={food.name} onChange={(event) => updateFoodName(index, event.target.value)} onBlur={() => commitFoodName(index)} aria-label={`编辑第${index + 1}道菜品`} /> : <span>{food.name}</span>}{index === selectedIndex && <em>今日</em>}{isEditing && <button className="remove-btn" onClick={() => removeFood(index)} aria-label={`删除${food.name}`}><Icon name="trash" size={15} /></button>}</div>)}</div>
              <button className="edit-link" onClick={() => setIsEditing((value) => !value)}>{isEditing ? '完成编辑' : '编辑菜品'}<span>→</span></button>
            </div>
          </aside>
        </section>

        <section className="history-section" aria-label="历史记录">
          <div className="section-head"><div><span className="section-label">A SMALL ARCHIVE</span><h2>最近吃过什么</h2></div><button className="history-link" onClick={() => setIsAddingHistory((value) => !value)}>{isAddingHistory ? '收起录入' : '手动记录'} <span>{isAddingHistory ? '−' : '+'}</span></button></div>
          {isAddingHistory && <form className="history-form" onSubmit={addHistoryRecord}><input name="foodName" value={manualFoodName} onChange={(event) => setManualFoodName(event.target.value)} placeholder="输入吃过的菜品" aria-label="手动录入菜品" required /><input name="foodDate" type="date" defaultValue={manualFoodDate} aria-label="记录日期" /><input name="foodNote" value={manualFoodNote} onChange={(event) => setManualFoodNote(event.target.value)} placeholder="备注（可选）" aria-label="历史记录备注" /><button type="submit">保存记录</button></form>}
          <div className="history-table"><div className="history-header"><span>菜品</span><span>时间</span><span>备注</span><span>操作</span></div>{history.length === 0 ? <div className="empty-history">还没有记录，转一次盘就会出现在这里。</div> : history.slice(0, 4).map((item, index) => <div className="history-row" key={`${item.name}-${item.time}-${index}`}><div className="history-food"><span className="history-number">0{index + 1}</span><strong>{item.name}</strong></div><span>{item.date}<br /><small>{item.time}</small></span><span className="muted-note">{item.note}</span><button className="history-delete" onClick={() => removeHistoryItem(index)} aria-label={`删除${item.name}这条记录`} title="删除这条记录"><Icon name="trash" size={15} /></button></div>)}</div>
          {history.length > 0 && <button className="clear-history" onClick={() => setHistory([])}>清空历史记录</button>}
        </section>
        <footer className="page-footer"><span>食 · 记 / 本地美食决定器</span><span>数据只保存在你的浏览器里</span></footer>
      </main>
    </div>
  )
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
    event.preventDefault()
    document.querySelector('.primary-button')?.click()
  }
})

createRoot(document.getElementById('root')).render(<App />)
