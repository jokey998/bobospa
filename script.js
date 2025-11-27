document.addEventListener('DOMContentLoaded', () => {
    // 判斷當前頁面是否有班表容器
    const scheduleTableBody = document.querySelector('#schedule-table tbody');
    const todayTitle = document.getElementById('today-title');
    const noScheduleMessage = document.getElementById('no-schedule-message');
    const scheduleTable = document.getElementById('schedule-table');

    if (scheduleTableBody) {
        // 讀取 JSON 資料
        // 加上 cache-busting 參數以防止瀏覽器快取舊資料 (?v=new Date().getTime())
        fetch('girls.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                renderSchedule(data);
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
                handleError();
            });
    }

    function handleError() {
        // 1. 更新標題狀態
        if (todayTitle) {
            todayTitle.textContent = "⚠️ 無法載入班表";
            todayTitle.style.color = "#7f8c8d";
        }

        // 2. 顯示錯誤訊息
        if (noScheduleMessage) {
            // 偵測是否為本機檔案開啟 (file://)
            if (window.location.protocol === 'file:') {
                noScheduleMessage.innerHTML = `
                    <div style="text-align: left; display: inline-block;">
                        <strong>無法讀取資料 (CORS 限制)</strong><br>
                        瀏覽器基於安全考量，禁止直接讀取電腦上的 JSON 檔。<br><br>
                        <strong>解決方法：</strong><br>
                        1. 請將檔案上傳至 <b>GitHub Pages</b> 後瀏覽。<br>
                        2. 或使用 VS Code 的 <b>Live Server</b> 套件開啟預覽。
                    </div>
                `;
            } else {
                noScheduleMessage.textContent = "無法載入班表資料，可能是網路問題或資料庫維護中。請稍後再試或直接聯繫波波詢問。";
            }
            noScheduleMessage.classList.remove('hidden');
        }

        // 3. 隱藏表格
        if (scheduleTable) scheduleTable.classList.add('hidden');
    }

    function getTodayChineseDay() {
        const dayNames = ["星期七", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        const date = new Date();
        const dayIndex = date.getDay(); 
        return dayNames[dayIndex];
    }

    function renderSchedule(personnelData) {
        const today = getTodayChineseDay();
        
        if (todayTitle) {
            todayTitle.textContent = `📅 今日 (${today}) 上班美容師`;
            todayTitle.style.color = "#2c3e50"; // 恢復正常顏色
        }

        const todayList = personnelData.filter(person => {
            return person.schedule && person.schedule[today];
        });

        scheduleTableBody.innerHTML = '';

        if (todayList.length === 0) {
            if (scheduleTable) scheduleTable.classList.add('hidden');
            if (noScheduleMessage) {
                noScheduleMessage.textContent = "今日目前沒有班表資訊，或資料更新中。請直接聯繫波波！";
                noScheduleMessage.classList.remove('hidden');
            }
        } else {
            if (scheduleTable) scheduleTable.classList.remove('hidden');
            if (noScheduleMessage) noScheduleMessage.classList.add('hidden');

            todayList.forEach(person => {
                const tr = document.createElement('tr');
                const workTime = person.schedule[today];
                const priceDisplay = person.price ? `$${person.price}` : "請詢問";

                tr.innerHTML = `
                    <td><strong>${person.name}</strong></td>
                    <td>${workTime}</td>
                    <td style="color: #e74c3c; font-weight: bold;">${priceDisplay}</td>
                `;
                scheduleTableBody.appendChild(tr);
            });
        }
    }
});