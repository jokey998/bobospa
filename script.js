
document.addEventListener('DOMContentLoaded', () => {
    // 元素參照
    const scheduleTableBody = document.querySelector('#schedule-table tbody');
    const todayTitle = document.getElementById('today-title');
    const noScheduleMessage = document.getElementById('no-schedule-message');
    const scheduleTable = document.getElementById('schedule-table');
    const tabToday = document.getElementById('tab-today');
    const tabAll = document.getElementById('tab-all');
    const searchInput = document.getElementById('search-name');
    const filterDay = document.getElementById('filter-day');
    const filterTagsContainer = document.getElementById('filter-tags-container');

    // 全域變數
    let allGirlsData = [];
    let currentMode = 'today'; // 'today' 或 'all'
    let activeTags = []; // 已選取的標籤

    // 可用的標籤列表 (可從資料自動生成，這裡先列出常用)
    const availableTags = ["甜美", "可愛", "高挑", "長髮", "短髮", "大奶", "小隻馬", "氣質", "配合度高", "女友感", "服務好"];

    // 初始化頁面
    init();

    function init() {
        if (scheduleTableBody) {
            // 1. 產生標籤按鈕
            renderTagFilters();

            // 2. 綁定事件監聽
            bindEvents();

            // 3. 讀取資料
            fetch('girls.json?v=' + new Date().getTime())
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(data => {
                    allGirlsData = data;
                    renderSchedule(); // 初始渲染
                    // 初始狀態下如果是 'today'，停用星期篩選
                    updateFilterState();
                })
                .catch(error => {
                    console.error('Fetch error:', error);
                    handleError();
                });
        }
    }

    function bindEvents() {
        // Tab 切換
        if (tabToday && tabAll) {
            tabToday.addEventListener('click', () => switchTab('today'));
            tabAll.addEventListener('click', () => switchTab('all'));
        }

        // 搜尋與篩選
        if (searchInput) searchInput.addEventListener('input', renderSchedule);
        if (filterDay) filterDay.addEventListener('change', renderSchedule);
    }

    function switchTab(mode) {
        currentMode = mode;
        
        // 更新 Tab 樣式
        if (mode === 'today') {
            tabToday.classList.add('active');
            tabAll.classList.remove('active');
            // 切換到今日時，強制將星期篩選歸零
            if(filterDay) filterDay.value = 'all'; 
        } else {
            tabToday.classList.remove('active');
            tabAll.classList.add('active');
        }
        
        updateFilterState();
        renderSchedule();
    }
    
    // 控制篩選器的可用狀態
    function updateFilterState() {
        if (!filterDay) return;
        
        if (currentMode === 'today') {
            filterDay.disabled = true;
            filterDay.style.opacity = '0.5';
            filterDay.style.cursor = 'not-allowed';
            filterDay.title = "今日模式下無法篩選星期";
        } else {
            filterDay.disabled = false;
            filterDay.style.opacity = '1';
            filterDay.style.cursor = 'pointer';
            filterDay.title = "";
        }
    }

    function renderTagFilters() {
        if (!filterTagsContainer) return;
        
        filterTagsContainer.innerHTML = '';
        availableTags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag-filter';
            span.textContent = tag;
            span.onclick = () => {
                // Toggle 標籤選取狀態
                if (activeTags.includes(tag)) {
                    activeTags = activeTags.filter(t => t !== tag);
                    span.classList.remove('active');
                } else {
                    activeTags.push(tag);
                    span.classList.add('active');
                }
                renderSchedule();
            };
            filterTagsContainer.appendChild(span);
        });
    }

    function handleError() {
        if (todayTitle) {
            todayTitle.textContent = "⚠️ 無法載入班表";
            todayTitle.style.color = "#7f8c8d";
        }
        if (noScheduleMessage) {
            noScheduleMessage.textContent = "無法載入資料，請稍後再試或直接聯繫波波。";
            noScheduleMessage.classList.remove('hidden');
        }
        if (scheduleTable) scheduleTable.classList.add('hidden');
    }

    function getTodayChineseDay() {
        const dayNames = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        const date = new Date();
        return dayNames[date.getDay()];
    }

    function renderSchedule() {
        if (!allGirlsData || allGirlsData.length === 0) return;

        const today = getTodayChineseDay();
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const selectedDay = filterDay ? filterDay.value : 'all';

        // 1. 篩選資料
        let filteredList = allGirlsData.filter(person => {
            let isMatch = true;

            // 模式篩選 (今日 vs 全部)
            if (currentMode === 'today') {
                if (!person.schedule || !person.schedule[today]) isMatch = false;
            } else {
                // 全部模式下，如果有選特定星期
                if (selectedDay !== 'all') {
                    if (!person.schedule || !person.schedule[selectedDay]) isMatch = false;
                }
            }

            // 名字搜尋
            if (searchTerm && !person.name.toLowerCase().includes(searchTerm)) {
                isMatch = false;
            }

            // 標籤篩選 (需包含所有選取的標籤 AND 邏輯)
            if (activeTags.length > 0) {
                const personTags = person.tags || [];
                const hasAllTags = activeTags.every(tag => personTags.includes(tag));
                if (!hasAllTags) isMatch = false;
            }

            return isMatch;
        });

        // 2. 更新標題
        if (todayTitle) {
            if (currentMode === 'today') {
                todayTitle.textContent = `📅 今日 (${today}) 上班美容師`;
            } else {
                todayTitle.textContent = `📋 全部美容師班表`;
            }
        }

        // 3. 渲染表格
        scheduleTableBody.innerHTML = '';

        if (filteredList.length === 0) {
            if (scheduleTable) scheduleTable.classList.add('hidden');
            if (noScheduleMessage) {
                noScheduleMessage.textContent = "沒有符合條件的美容師。";
                noScheduleMessage.classList.remove('hidden');
            }
        } else {
            if (scheduleTable) scheduleTable.classList.remove('hidden');
            if (noScheduleMessage) noScheduleMessage.classList.add('hidden');

            filteredList.forEach(person => {
                const tr = document.createElement('tr');
                const priceDisplay = person.price ? `$${person.price}` : "請詢問";
                
                // 決定顯示的時間內容
                let workTimeDisplay = '';
                if (currentMode === 'today') {
                    workTimeDisplay = person.schedule[today];
                } else {
                    // 全部模式：顯示有上班的星期，或者如果選了特定星期則顯示該時間
                    if (selectedDay !== 'all') {
                        workTimeDisplay = person.schedule[selectedDay];
                    } else {
                        // 顯示所有有班的星期 (簡寫)
                        const days = Object.keys(person.schedule).map(d => d.replace('星期', ''));
                        workTimeDisplay = days.join(', ');
                        if(!workTimeDisplay) workTimeDisplay = "暫無班表";
                    }
                }

                // --- 1. 照片 ---
                const tdPhoto = document.createElement('td');
                const img = document.createElement('img');
                img.src = `${person.name}.jpg`;
                img.alt = person.name;
                img.className = 'beautician-img';
                img.onclick = function() { openModal(this.src); };
                img.onerror = function() {
                    this.onerror = null;
                    this.src = 'logo.jpg';
                    this.onclick = null;
                    this.style.cursor = 'default';
                };
                tdPhoto.appendChild(img);
                tr.appendChild(tdPhoto);

                // --- 2. 名字 & 標籤 ---
                const tdName = document.createElement('td');
                
                // 名字連結
                const nameLink = document.createElement('a');
                nameLink.href = `reviews.html?name=${encodeURIComponent(person.name)}`;
                nameLink.className = 'name-link';
                nameLink.innerHTML = `<strong>${person.name}</strong> 🔗`;
                tdName.appendChild(nameLink);
                
                // 顯示該美容師的標籤
                if (person.tags && person.tags.length > 0) {
                    const tagsDiv = document.createElement('div');
                    tagsDiv.className = 'tags-display';
                    person.tags.forEach(t => {
                        const tSpan = document.createElement('span');
                        tSpan.className = 'tag-badge';
                        tSpan.textContent = t;
                        tagsDiv.appendChild(tSpan);
                    });
                    tdName.appendChild(tagsDiv);
                }

                tr.appendChild(tdName);

                // --- 3. 時間 ---
                const tdTime = document.createElement('td');
                tdTime.textContent = workTimeDisplay;
                tr.appendChild(tdTime);

                // --- 4. 費用 ---
                const tdPrice = document.createElement('td');
                tdPrice.style.color = '#e74c3c';
                tdPrice.style.fontWeight = 'bold';
                tdPrice.textContent = priceDisplay;
                tr.appendChild(tdPrice);

                scheduleTableBody.appendChild(tr);
            });
        }
    }
});