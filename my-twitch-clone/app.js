// ========================================
// ========== ГЛОБАЛЬНЫЕ ДАННЫЕ ==========
// ========================================

let currentUser = {
    email: localStorage.getItem('current_user_email') || null,
    role: localStorage.getItem('current_user_role') || null
};

let DB = {
    students: JSON.parse(localStorage.getItem('db_students')) || [
        { id: 1, name: 'Алексей Иванов', email: 'alex@mail.ru', course: 'Python для начинающих', paid: true, progress: 45 },
        { id: 2, name: 'Мария Петрова', email: 'maria@mail.ru', course: 'Python для начинающих', paid: true, progress: 70 },
        { id: 3, name: 'Дмитрий Смирнов', email: 'dmitry@mail.ru', course: 'Python для начинающих', paid: false, progress: 10 },
        { id: 4, name: 'Елена Козлова', email: 'elena@mail.ru', course: 'Python для начинающих', paid: true, progress: 90 },
        { id: 5, name: 'Иван Соколов', email: 'ivan@mail.ru', course: 'Python для начинающих', paid: false, progress: 0 },
    ],
    courses: JSON.parse(localStorage.getItem('db_courses')) || [
        { id: 1, title: 'Python для начинающих', description: 'Полный курс с нуля', price: 4990, level: 0 },
    ],
    videos: JSON.parse(localStorage.getItem('db_videos')) || [],
    files: JSON.parse(localStorage.getItem('db_files')) || [],
    payments: JSON.parse(localStorage.getItem('db_payments')) || [],
    completedLessons: JSON.parse(localStorage.getItem('db_completed_lessons')) || [],
    isPaid: localStorage.getItem('db_is_paid') === 'true',
    nextId: parseInt(localStorage.getItem('db_next_id')) || 100,
};

// ========================================
// ========== СОХРАНЕНИЕ ==========
// ========================================
function saveDB() {
    localStorage.setItem('db_students', JSON.stringify(DB.students));
    localStorage.setItem('db_courses', JSON.stringify(DB.courses));
    localStorage.setItem('db_videos', JSON.stringify(DB.videos));
    localStorage.setItem('db_files', JSON.stringify(DB.files));
    localStorage.setItem('db_payments', JSON.stringify(DB.payments));
    localStorage.setItem('db_completed_lessons', JSON.stringify(DB.completedLessons));
    localStorage.setItem('db_is_paid', DB.isPaid);
    localStorage.setItem('db_next_id', DB.nextId);
}

function getNextId() { return DB.nextId++; }

// ========================================
// ========== TOAST ==========
// ========================================
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// ========================================
// ========== АУТЕНТИФИКАЦИЯ ==========
// ========================================
function toggleAuth() {
    document.getElementById('authModal').classList.toggle('active');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (email === 'admin@python.school' && password === 'admin123') {
        currentUser.email = email;
        currentUser.role = 'admin';
        localStorage.setItem('current_user_email', email);
        localStorage.setItem('current_user_role', 'admin');
        closeAuthModal();
        showToast('✅ Добро пожаловать, администратор!', 'success');
        setTimeout(() => window.location.href = 'admin.html', 500);
        return;
    }
    
    if (email === 'student@python.school' && password === 'python123') {
        currentUser.email = email;
        currentUser.role = 'student';
        localStorage.setItem('current_user_email', email);
        localStorage.setItem('current_user_role', 'student');
        closeAuthModal();
        showToast('✅ Добро пожаловать, студент!', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 500);
        return;
    }
    
    showToast('❌ Неверный email или пароль', 'error');
}

function logout() {
    currentUser.email = null;
    currentUser.role = null;
    localStorage.removeItem('current_user_email');
    localStorage.removeItem('current_user_role');
    showToast('👋 Вы вышли из системы', 'info');
    setTimeout(() => window.location.href = 'index.html', 500);
}

function checkAdminAccess() {
    const isAdmin = currentUser.role === 'admin';
    const content = document.getElementById('adminContent');
    const denied = document.getElementById('accessDenied');
    
    if (isAdmin) {
        if (content) content.style.display = 'block';
        if (denied) denied.style.display = 'none';
    } else {
        if (content) content.style.display = 'none';
        if (denied) denied.style.display = 'flex';
    }
}

// ========================================
// ========== ЮMONEY ОПЛАТА ==========
// ========================================
function purchaseCourse() {
    if (DB.isPaid) {
        showToast('✅ Курс уже оплачен!', 'success');
        return;
    }
    document.getElementById('paymentModal').classList.add('active');
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
}

function processPayment() {
    const price = DB.courses[0]?.price || 4990;
    const testMode = localStorage.getItem('yoomoney_test_mode') !== 'false';
    
    showToast('⏳ Проверка оплаты через ЮMoney...', 'info');
    
    if (testMode) {
        // Тестовый режим — автоподтверждение
        setTimeout(() => {
            DB.isPaid = true;
            saveDB();
            closePaymentModal();
            showToast('✅ Оплата подтверждена! Доступ открыт.', 'success');
            
            // Добавляем в историю
            DB.payments.push({
                id: getNextId(),
                student: 'Студент',
                course: 'Python для начинающих',
                amount: price,
                date: new Date().toLocaleString(),
                status: 'paid'
            });
            saveDB();
            updateUI();
            renderAllTables();
        }, 2000);
    } else {
        // Реальный режим — ждём подтверждения от админа
        showToast('⏳ Ожидайте подтверждения оплаты администратором', 'info');
        closePaymentModal();
        
        // Добавляем в историю как ожидающий
        DB.payments.push({
            id: getNextId(),
            student: 'Студент',
            course: 'Python для начинающих',
            amount: price,
            date: new Date().toLocaleString(),
            status: 'pending'
        });
        saveDB();
        renderAllTables();
    }
}

// ========================================
// ========== ВИДЕОПЛЕЕР ==========
// ========================================
let currentLessonIndex = 0;
let isPlaying = false;

function loadLesson(index) {
    const lesson = DB.videos[index];
    if (!lesson) return;
    
    document.getElementById('lessonTitle').textContent = lesson.title;
    document.getElementById('lessonDuration').textContent = `⏱ ${lesson.duration} мин`;
    document.getElementById('lessonDescription').textContent = `Урок ${index + 1} из ${DB.videos.length}`;
    
    const isCompleted = DB.completedLessons.includes(lesson.id);
    document.getElementById('lessonStatus').textContent = isCompleted ? '✅ Пройдено' : '📹 Не просмотрено';
    document.getElementById('lessonStatus').className = 'lesson-status' + (isCompleted ? ' completed' : '');
    
    const video = document.getElementById('courseVideo');
    const source = document.getElementById('videoSource');
    if (video && source) {
        // Используем данные видео из базы (сохраняем как base64 или URL)
        if (lesson.videoData) {
            source.src = lesson.videoData;
        } else if (lesson.videoUrl) {
            source.src = lesson.videoUrl;
        }
        video.load();
    }
    
    updateDownloadButton();
    renderLessonList();
    updateProgress();
}

function renderLessonList() {
    const list = document.getElementById('lessonList');
    if (!list) return;
    
    list.innerHTML = DB.videos.map((lesson, index) => {
        const isCompleted = DB.completedLessons.includes(lesson.id);
        const isActive = index === currentLessonIndex;
        return `
            <li class="${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" onclick="selectLesson(${index})">
                <span class="lesson-number">${String(index + 1).padStart(2, '0')}</span>
                <span class="lesson-title">${lesson.title}</span>
                <span class="lesson-status-icon">${isCompleted ? '✅' : '📹'}</span>
            </li>
        `;
    }).join('');
}

function selectLesson(index) {
    currentLessonIndex = index;
    loadLesson(index);
    renderLessonList();
}

function updateProgress() {
    const total = DB.videos.length;
    const completed = DB.completedLessons.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById('totalProgress').textContent = percent;
    document.getElementById('progressFill').style.width = `${percent}%`;
}

function updateDownloadButton() {
    const btn = document.getElementById('downloadBtn');
    const info = document.getElementById('downloadInfo');
    const paymentSection = document.getElementById('paymentSection');
    
    if (!btn) return;
    
    if (DB.isPaid) {
        btn.textContent = '📦 Скачать исходники к уроку';
        btn.className = 'btn btn-success btn-download';
        btn.disabled = false;
        if (info) {
            const lesson = DB.videos[currentLessonIndex];
            const files = DB.files.filter(f => f.lesson === lesson?.title);
            info.innerHTML = `<span class="file-size">📄 Файлов: ${files.length}</span><span class="file-format">ZIP архив</span>`;
        }
        if (paymentSection) paymentSection.style.display = 'none';
    } else {
        btn.textContent = '🔒 Доступно после оплаты';
        btn.className = 'btn btn-secondary btn-download';
        btn.disabled = true;
        if (info) {
            info.innerHTML = `<span class="file-size">💳 Оплатите через ЮMoney</span><span class="file-format">для доступа к исходникам</span>`;
        }
        if (paymentSection) paymentSection.style.display = 'block';
    }
}

function togglePlay() {
    const video = document.getElementById('courseVideo');
    const btn = document.getElementById('playBtn');
    if (!video) return;
    if (video.paused) {
        video.play();
        btn.textContent = '⏸';
        isPlaying = true;
    } else {
        video.pause();
        btn.textContent = '▶';
        isPlaying = false;
    }
}

function toggleSpeed() {
    const video = document.getElementById('courseVideo');
    const btn = document.getElementById('speedBtn');
    if (!video || !btn) return;
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    let currentSpeed = video.playbackRate || 1;
    let index = speeds.indexOf(currentSpeed);
    index = (index + 1) % speeds.length;
    video.playbackRate = speeds[index];
    btn.textContent = `${speeds[index]}x`;
}

function toggleFullscreen() {
    const wrapper = document.getElementById('videoWrapper');
    if (!wrapper) return;
    if (!document.fullscreenElement) {
        wrapper.requestFullscreen().catch(() => {
            const video = document.getElementById('courseVideo');
            if (video && video.requestFullscreen) video.requestFullscreen();
        });
    } else {
        document.exitFullscreen();
    }
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('courseVideo');
    if (video) {
        video.addEventListener('loadedmetadata', updateTimeDisplay);
        video.addEventListener('timeupdate', () => {
            updateTimeDisplay();
            updateProgressBar();
        });
        video.addEventListener('ended', () => {
            const lesson = DB.videos[currentLessonIndex];
            if (lesson && !DB.completedLessons.includes(lesson.id)) {
                DB.completedLessons.push(lesson.id);
                saveDB();
                renderLessonList();
                updateProgress();
                showToast('🎉 Урок завершён! Отлично!', 'success');
            }
        });
    }
});

function updateTimeDisplay() {
    const video = document.getElementById('courseVideo');
    const display = document.getElementById('timeDisplay');
    if (!video || !display) return;
    const current = formatTime(video.currentTime || 0);
    const duration = formatTime(video.duration || 0);
    display.textContent = `${current} / ${duration}`;
}

function updateProgressBar() {
    const video = document.getElementById('courseVideo');
    const bar = document.getElementById('progressBar');
    if (!video || !bar || !video.duration) return;
    bar.value = (video.currentTime / video.duration) * 100;
}

// ========================================
// ========== СКАЧИВАНИЕ ==========
// ========================================
function downloadSources() {
    if (!DB.isPaid) {
        showToast('💳 Оплатите через ЮMoney для доступа к исходникам!', 'error');
        return;
    }
    
    const lesson = DB.videos[currentLessonIndex];
    if (!lesson) return;
    
    const message = document.getElementById('downloadMessage');
    const files = DB.files.filter(f => f.lesson === lesson.title);
    
    if (files.length === 0) {
        message.className = 'download-message error';
        message.textContent = '❌ Исходники для этого урока отсутствуют';
        return;
    }
    
    message.className = 'download-message success';
    message.textContent = '📦 Подготовка архива...';
    
    setTimeout(() => {
        const content = files.map(f => `- ${f.name} (${f.size})`).join('\n');
        const blob = new Blob([`Исходники для урока: ${lesson.title}\n\n${content}`], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lesson_${lesson.id}_sources.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        message.textContent = '✅ Исходники успешно скачаны!';
        setTimeout(() => { message.textContent = ''; message.className = 'download-message'; }, 5000);
    }, 1500);
}

// ========================================
// ========== ДОМАШНЕЕ ЗАДАНИЕ ==========
// ========================================
function showHomework() {
    document.getElementById('homeworkModal').classList.add('active');
}

function closeHomeworkModal() {
    document.getElementById('homeworkModal').classList.remove('active');
}

function submitHomework(e) {
    e.preventDefault();
    const file = document.getElementById('homeworkFile').files[0];
    if (!file) { showToast('Выберите файл', 'error'); return; }
    showToast(`✅ Задание отправлено! Файл: ${file.name}`, 'success');
    closeHomeworkModal();
    document.getElementById('homeworkFile').value = '';
    document.getElementById('homeworkComment').value = '';
}

// ========================================
// ========== ЛИЧНЫЙ КАБИНЕТ ==========
// ========================================
function initDashboard() {
    const name = localStorage.getItem('db_user_name') || 'Студент';
    const email = currentUser.email || 'student@python.school';
    
    document.getElementById('userName').textContent = name;
    document.getElementById('userEmail').textContent = email;
    document.getElementById('settingsName').value = name;
    document.getElementById('settingsEmail').value = email;
    
    if (currentUser.role === 'admin') {
        document.getElementById('userRole').textContent = '🔑 Администратор';
        document.getElementById('userRole').style.color = 'var(--primary-light)';
    } else {
        document.getElementById('userRole').textContent = '👨‍🎓 Студент';
        document.getElementById('userRole').style.color = 'var(--text-muted)';
    }
    
    const paidStatus = document.getElementById('userPaidStatus');
    if (DB.isPaid) {
        paidStatus.textContent = '✅ Курс оплачен через ЮMoney';
        paidStatus.style.color = '#4CAF50';
    } else {
        paidStatus.textContent = '❌ Курс не куплен';
        paidStatus.style.color = '#FF6584';
    }
    
    document.getElementById('coursesCount').textContent = DB.courses.length;
    document.getElementById('lessonsCompleted').textContent = DB.completedLessons.length;
    document.getElementById('totalHours').textContent = Math.round((DB.videos.length * 0.3));
    
    const total = DB.videos.length;
    const completed = DB.completedLessons.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById('dashboardProgressFill').style.width = `${percent}%`;
    document.getElementById('dashboardProgressText').textContent = `${percent}%`;
    document.getElementById('courseStatus').textContent = percent === 100 ? '✅ Завершён' : 'В процессе';
    
    renderHistory();
    renderFilesLibrary();
}

function renderHistory() {
    const tbody = document.getElementById('historyBody');
    if (!tbody) return;
    const userPayments = DB.payments.filter(p => p.student === 'Студент' || p.student === localStorage.getItem('db_user_name'));
    if (userPayments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">Нет платежей</td></tr>`;
        return;
    }
    tbody.innerHTML = userPayments.map(p => `
        <tr>
            <td>${p.date}</td>
            <td>${p.course}</td>
            <td>${p.amount.toLocaleString()} ₽</td>
            <td><span class="status-badge ${p.status === 'paid' ? 'paid' : 'pending'}">${p.status === 'paid' ? '✅ Оплачено' : '⏳ Ожидание'}</span></td>
        </tr>
    `).join('');
}

function renderFilesLibrary() {
    const grid = document.getElementById('filesGrid');
    const message = document.getElementById('filesAccessMessage');
    const text = document.getElementById('filesAccessText');
    if (!grid) return;
    
    if (!DB.isPaid) {
        if (message) message.style.display = 'block';
        if (text) text.textContent = '💳 Купите курс через ЮMoney, чтобы получить доступ к исходникам';
        grid.innerHTML = '';
        return;
    }
    if (message) message.style.display = 'none';
    
    if (DB.files.length === 0) {
        grid.innerHTML = `<p style="color:var(--text-muted);">Нет доступных файлов</p>`;
        return;
    }
    grid.innerHTML = DB.files.map(file => `
        <div class="file-card">
            <div class="file-icon">📄</div>
            <div class="file-name">${file.name}</div>
            <div class="file-meta">${file.size} • ${file.lesson}</div>
            <button class="btn-download-file" onclick="downloadFileFromLibrary('${file.name}')">⬇ Скачать</button>
        </div>
    `).join('');
}

function downloadFileFromLibrary(fileName) {
    if (!DB.isPaid) { showToast('Купите курс для доступа к файлам', 'error'); return; }
    showToast(`⬇ Скачивание ${fileName}...`, 'info');
    setTimeout(() => showToast(`✅ ${fileName} скачан!`, 'success'), 1000);
}

function downloadAllSources() {
    if (!DB.isPaid) { showToast('Купите курс для скачивания всех исходников', 'error'); return; }
    if (DB.files.length === 0) { showToast('Нет доступных файлов', 'error'); return; }
    showToast('📦 Подготовка полного архива...', 'info');
    setTimeout(() => {
        const content = DB.files.map(f => `- ${f.name} (${f.size})`).join('\n');
        const blob = new Blob([`Все исходники курса:\n\n${content}`], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'all_course_sources.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('✅ Все исходники скачаны!', 'success');
    }, 1500);
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`tab-${tab}`);
    if (target) target.classList.add('active');
    const btns = document.querySelectorAll('.tab-btn');
    const map = { 'progress': 0, 'files': 1, 'history': 2, 'settings': 3 };
    if (btns[map[tab]]) btns[map[tab]].classList.add('active');
}

function updateSettings(e) {
    e.preventDefault();
    const name = document.getElementById('settingsName').value;
    const email = document.getElementById('settingsEmail').value;
    localStorage.setItem('db_user_name', name);
    localStorage.setItem('db_user_email', email);
    document.getElementById('userName').textContent = name;
    document.getElementById('userEmail').textContent = email;
    showToast('✅ Настройки сохранены!', 'success');
}

// ========================================
// ========== МОБИЛЬНОЕ МЕНЮ ==========
// ========================================
function toggleMobileMenu() {
    document.getElementById('mainNav').classList.toggle('active');
}

document.addEventListener('click', (e) => {
    const nav = document.getElementById('mainNav');
    const btn = document.querySelector('.mobile-menu-btn');
    if (nav && btn && !nav.contains(e.target) && !btn.contains(e.target)) {
        nav.classList.remove('active');
    }
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// ========================================
// ========== АДМИН-ПАНЕЛЬ ==========
// ========================================
function switchAdminSection(section) {
    document.querySelectorAll('.admin-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.admin-sidebar .nav-item').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`section-${section}`);
    if (target) target.classList.add('active');
    document.querySelector(`.admin-sidebar .nav-item[onclick*="${section}"]`)?.classList.add('active');
    renderAllTables();
}

function renderAllTables() {
    renderStudentsTable();
    renderCoursesTable();
    renderVideosTable();
    renderFilesTable();
    renderPaymentsTable();
    renderRecentStudents();
    renderRecentVideos();
    updateStats();
    updateBadges();
}

// СТУДЕНТЫ
function renderStudentsTable() {
    const tbody = document.getElementById('studentsBody');
    if (!tbody) return;
    tbody.innerHTML = DB.students.map((s, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${s.name}</strong></td>
            <td>${s.email}</td>
            <td>${s.course}</td>
            <td><span class="status-badge ${s.paid ? 'paid' : 'unpaid'}">${s.paid ? '✅ Оплачено' : '❌ Нет'}</span></td>
            <td>
                <div style="display:flex;align-items:center;gap:6px;min-width:80px;">
                    <div style="flex:1;height:4px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden;">
                        <div style="height:100%;width:${s.progress || 0}%;background:var(--gradient);border-radius:2px;"></div>
                    </div>
                    <span style="font-size:11px;color:var(--text-muted);">${s.progress || 0}%</span>
                </div>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editStudent(${s.id})">✏️</button>
                <button class="btn btn-sm btn-danger" onclick="deleteStudent(${s.id})">🗑</button>
            </td>
        </tr>
    `).join('');
}

function addStudent() {
    const name = prompt('Имя студента:'); if (!name) return;
    const email = prompt('Email:'); if (!email) return;
    const course = prompt('Курс:'); if (!course) return;
    DB.students.push({ id: getNextId(), name, email, course, paid: false, progress: 0 });
    saveDB();
    renderAllTables();
    showToast('✅ Студент добавлен', 'success');
}

function editStudent(id) {
    const student = DB.students.find(s => s.id === id);
    if (!student) return;
    document.getElementById('editStudentId').value = student.id;
    document.getElementById('editStudentName').value = student.name;
    document.getElementById('editStudentEmail').value = student.email;
    const select = document.getElementById('editStudentCourse');
    select.innerHTML = DB.courses.map(c => 
        `<option value="${c.title}" ${c.title === student.course ? 'selected' : ''}>${c.title}</option>`
    ).join('');
    document.getElementById('editStudentPaid').value = student.paid ? 'true' : 'false';
    document.getElementById('editStudentModal').classList.add('active');
}

function updateStudent(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('editStudentId').value);
    const student = DB.students.find(s => s.id === id);
    if (!student) return;
    student.name = document.getElementById('editStudentName').value;
    student.email = document.getElementById('editStudentEmail').value;
    student.course = document.getElementById('editStudentCourse').value;
    student.paid = document.getElementById('editStudentPaid').value === 'true';
    saveDB();
    renderAllTables();
    document.getElementById('editStudentModal').classList.remove('active');
    showToast('✅ Студент обновлён', 'success');
}

function deleteStudent(id) {
    if (!confirm('Удалить студента?')) return;
    DB.students = DB.students.filter(s => s.id !== id);
    saveDB();
    renderAllTables();
    showToast('🗑 Студент удалён', 'info');
}

// КУРСЫ
function renderCoursesTable() {
    const tbody = document.getElementById('coursesBody');
    if (!tbody) return;
    tbody.innerHTML = DB.courses.map(c => {
        const vCount = DB.videos.filter(v => v.course === c.title).length;
        const sCount = DB.students.filter(s => s.course === c.title).length;
        return `
            <tr>
                <td><strong>${c.title}</strong></td>
                <td>${c.price.toLocaleString()} ₽</td>
                <td>${vCount}</td>
                <td>${sCount}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="editCourse(${c.id})">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCourse(${c.id})">🗑</button>
                </td>
            </tr>
        `;
    }).join('');
}

function createCourse(e) {
    e.preventDefault();
    DB.courses.push({
        id: getNextId(),
        title: document.getElementById('courseTitle').value,
        description: document.getElementById('courseDescription').value,
        price: parseFloat(document.getElementById('coursePrice').value) || 4990,
        level: parseInt(document.getElementById('courseLevel').value)
    });
    saveDB();
    renderAllTables();
    document.getElementById('addCourseForm').style.display = 'none';
    document.getElementById('courseTitle').value = '';
    showToast('✅ Курс создан', 'success');
}

function editCourse(id) {
    const course = DB.courses.find(c => c.id === id);
    if (!course) return;
    const title = prompt('Название:', course.title);
    if (title) course.title = title;
    const price = prompt('Цена:', course.price);
    if (price) course.price = parseFloat(price);
    saveDB();
    renderAllTables();
    showToast('✅ Курс обновлён', 'success');
}

function deleteCourse(id) {
    if (!confirm('Удалить курс?')) return;
    const course = DB.courses.find(c => c.id === id);
    if (course) {
        DB.videos = DB.videos.filter(v => v.course !== course.title);
        DB.files = DB.files.filter(f => f.lesson !== course.title);
    }
    DB.courses = DB.courses.filter(c => c.id !== id);
    saveDB();
    renderAllTables();
    showToast('🗑 Курс удалён', 'info');
}

// ВИДЕО - С ЗАГРУЗКОЙ ФАЙЛОВ
function renderVideosTable() {
    const tbody = document.getElementById('videosBody');
    if (!tbody) return;
    tbody.innerHTML = DB.videos.map(v => `
        <tr>
            <td><strong>${v.title}</strong></td>
            <td>${v.course}</td>
            <td>${v.duration} мин</td>
            <td>
                ${v.videoData ? `<video class="video-preview" src="${v.videoData}" muted style="max-width:120px;border-radius:6px;"></video>` : '📹 Загружено'}
            </td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editVideo(${v.id})">✏️</button>
                <button class="btn btn-sm btn-danger" onclick="deleteVideo(${v.id})">🗑</button>
            </td>
        </tr>
    `).join('');
}

function populateCourseSelects() {
    ['videoCourse', 'fileLesson', 'editStudentCourse'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = DB.courses.map(c => 
                `<option value="${c.title}">${c.title}</option>`
            ).join('');
        }
    });
}

function populateFileLessonSelect() {
    const el = document.getElementById('fileLesson');
    if (el) {
        el.innerHTML = DB.videos.map(v => 
            `<option value="${v.title}">${v.title}</option>`
        ).join('');
    }
}

function createVideo(e) {
    e.preventDefault();
    const fileInput = document.getElementById('videoFile');
    if (!fileInput.files || fileInput.files.length === 0) {
        showToast('Выберите видеофайл', 'error');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
        DB.videos.push({
            id: getNextId(),
            title: document.getElementById('videoTitle').value,
            course: document.getElementById('videoCourse').value,
            videoData: event.target.result, // base64
            duration: parseInt(document.getElementById('videoDuration').value) || 15,
            order: parseInt(document.getElementById('videoOrder').value) || 1
        });
        saveDB();
        renderAllTables();
        document.getElementById('addVideoForm').style.display = 'none';
        document.getElementById('videoTitle').value = '';
        document.getElementById('videoFile').value = '';
        showToast('✅ Видео загружено!', 'success');
    };
    reader.readAsDataURL(file);
}

function editVideo(id) {
    const video = DB.videos.find(v => v.id === id);
    if (!video) return;
    const title = prompt('Название:', video.title);
    if (title) video.title = title;
    const duration = prompt('Длительность (мин):', video.duration);
    if (duration) video.duration = parseInt(duration);
    saveDB();
    renderAllTables();
    showToast('✅ Видео обновлено', 'success');
}

function deleteVideo(id) {
    if (!confirm('Удалить видео?')) return;
    DB.videos = DB.videos.filter(v => v.id !== id);
    saveDB();
    renderAllTables();
    showToast('🗑 Видео удалено', 'info');
}

// ФАЙЛЫ
function renderFilesTable() {
    const tbody = document.getElementById('filesBody');
    if (!tbody) return;
    tbody.innerHTML = DB.files.map(f => `
        <tr>
            <td><strong>${f.name}</strong></td>
            <td>${f.lesson}</td>
            <td>${f.size}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="downloadFileAdmin(${f.id})">⬇</button>
                <button class="btn btn-sm btn-danger" onclick="deleteFile(${f.id})">🗑</button>
            </td>
        </tr>
    `).join('');
}

function uploadFile(e) {
    e.preventDefault();
    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files || fileInput.files.length === 0) {
        showToast('Выберите файл', 'error');
        return;
    }
    const file = fileInput.files[0];
    const size = (file.size / 1024) > 1024 ? 
        `${(file.size / 1024 / 1024).toFixed(1)} MB` : 
        `${(file.size / 1024).toFixed(1)} KB`;
    DB.files.push({
        id: getNextId(),
        name: document.getElementById('fileName').value || file.name,
        lesson: document.getElementById('fileLesson').value,
        size: size,
        type: '.' + file.name.split('.').pop()
    });
    saveDB();
    renderAllTables();
    document.getElementById('addFileForm').style.display = 'none';
    document.getElementById('fileName').value = '';
    document.getElementById('fileInput').value = '';
    showToast('✅ Файл загружен', 'success');
}

function downloadFileAdmin(id) {
    const file = DB.files.find(f => f.id === id);
    if (!file) return;
    showToast(`⬇ Скачивание ${file.name}...`, 'info');
    setTimeout(() => showToast(`✅ ${file.name} скачан`, 'success'), 1000);
}

function deleteFile(id) {
    if (!confirm('Удалить файл?')) return;
    DB.files = DB.files.filter(f => f.id !== id);
    saveDB();
    renderAllTables();
    showToast('🗑 Файл удалён', 'info');
}

// ПЛАТЕЖИ
function renderPaymentsTable() {
    const tbody = document.getElementById('paymentsBody');
    if (!tbody) return;
    tbody.innerHTML = DB.payments.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${p.student}</td>
            <td>${p.course}</td>
            <td>${p.amount.toLocaleString()} ₽</td>
            <td>${p.date}</td>
            <td><span class="status-badge ${p.status === 'paid' ? 'paid' : 'pending'}">${p.status === 'paid' ? '✅ Оплачено' : '⏳ Ожидание'}</span></td>
            <td>
                ${p.status === 'pending' ? 
                    `<button class="btn btn-primary btn-sm" onclick="confirmPayment(${p.id})">Подтвердить</button>` :
                    `<button class="btn btn-sm btn-danger" onclick="refundPayment(${p.id})">Возврат</button>`
                }
            </td>
        </tr>
    `).join('');
}

function confirmPayment(id) {
    const payment = DB.payments.find(p => p.id === id);
    if (!payment) return;
    payment.status = 'paid';
    const student = DB.students.find(s => s.name === payment.student);
    if (student) student.paid = true;
    DB.isPaid = true;
    saveDB();
    renderAllTables();
    showToast('✅ Платёж подтверждён! Доступ открыт.', 'success');
}

function refundPayment(id) {
    if (!confirm('Вернуть платеж?')) return;
    DB.payments = DB.payments.filter(p => p.id !== id);
    saveDB();
    renderAllTables();
    showToast('💰 Платёж возвращён', 'info');
}

// СТАТИСТИКА
function updateStats() {
    document.getElementById('statStudents').textContent = DB.students.length;
    document.getElementById('statPaid').textContent = DB.students.filter(s => s.paid).length;
    document.getElementById('statLessons').textContent = DB.videos.length;
    const revenue = DB.payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    document.getElementById('statRevenue').textContent = revenue.toLocaleString() + ' ₽';
}

function updateBadges() {
    ['studentsBadge', 'coursesBadge', 'videosBadge', 'filesBadge', 'paymentsBadge'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const map = {
                studentsBadge: DB.students.length,
                coursesBadge: DB.courses.length,
                videosBadge: DB.videos.length,
                filesBadge: DB.files.length,
                paymentsBadge: DB.payments.length
            };
            el.textContent = map[id] || 0;
        }
    });
}

function renderRecentStudents() {
    const tbody = document.getElementById('recentStudentsBody');
    if (!tbody) return;
    const recent = DB.students.slice(-3).reverse();
    tbody.innerHTML = recent.map(s => `
        <tr><td>${s.name}</td><td>${s.email}</td><td><span class="status-badge ${s.paid ? 'paid' : 'unpaid'}">${s.paid ? '✅' : '❌'}</span></td></tr>
    `).join('');
}

function renderRecentVideos() {
    const tbody = document.getElementById('recentVideosBody');
    if (!tbody) return;
    const recent = DB.videos.slice(-3).reverse();
    tbody.innerHTML = recent.map(v => `
        <tr><td>${v.title}</td><td>${v.course}</td><td><span class="status-badge paid">✅</span></td></tr>
    `).join('');
}

// НАСТРОЙКИ
function savePaymentSettings(e) {
    e.preventDefault();
    localStorage.setItem('yoomoney_wallet', document.getElementById('yoomoneyWallet').value);
    localStorage.setItem('yoomoney_test_mode', document.getElementById('yoomoneyTestMode').value);
    showToast('✅ Настройки ЮMoney сохранены', 'success');
}

function saveSettings() {
    localStorage.setItem('settings_school_name', document.getElementById('settingsSchoolName').value);
    localStorage.setItem('settings_admin_email', document.getElementById('settingsAdminEmail').value);
    localStorage.setItem('settings_default_price', document.getElementById('settingsDefaultPrice').value);
    showToast('✅ Настройки сохранены', 'success');
}

function exportData() {
    const data = { ...DB, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `python_school_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📦 Данные экспортированы', 'success');
}

// ========================================
// ========== ОБНОВЛЕНИЕ UI ==========
// ========================================
function updateUI() {
    document.getElementById('totalLessons').textContent = DB.videos.length;
    document.getElementById('totalStudents').textContent = DB.students.length;
    document.getElementById('coursePrice').textContent = `${DB.courses[0]?.price || 4990} ₽`;
    
    const paymentStatus = document.getElementById('paymentStatus');
    if (paymentStatus) {
        if (DB.isPaid) {
            paymentStatus.textContent = '✅ Курс оплачен через ЮMoney! Доступ открыт.';
            paymentStatus.style.color = '#4CAF50';
        } else {
            paymentStatus.textContent = '💳 Оплатите через ЮMoney для доступа к исходникам';
            paymentStatus.style.color = 'var(--text-muted)';
        }
    }
    
    const authLink = document.getElementById('authLink');
    if (authLink) {
        if (currentUser.email) {
            authLink.textContent = 'Выйти';
            authLink.onclick = function(e) { e.preventDefault(); logout(); };
        } else {
            authLink.textContent = 'Вход';
            authLink.onclick = function(e) { e.preventDefault(); toggleAuth(); };
        }
    }
}

// ========================================
// ========== ИНИЦИАЛИЗАЦИЯ ==========
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    
    const savedEmail = localStorage.getItem('current_user_email');
    const savedRole = localStorage.getItem('current_user_role');
    if (savedEmail && savedRole) {
        currentUser.email = savedEmail;
        currentUser.role = savedRole;
    }
    
    if (path.includes('admin.html')) {
        checkAdminAccess();
        if (currentUser.role === 'admin') {
            renderAllTables();
            populateCourseSelects();
            populateFileLessonSelect();
            document.getElementById('yoomoneyWallet').value = localStorage.getItem('yoomoney_wallet') || '4100111111111111';
            document.getElementById('yoomoneyTestMode').value = localStorage.getItem('yoomoney_test_mode') || 'true';
            document.getElementById('settingsSchoolName').value = localStorage.getItem('settings_school_name') || 'Python School';
            document.getElementById('settingsAdminEmail').value = localStorage.getItem('settings_admin_email') || 'admin@python.school';
            document.getElementById('settingsDefaultPrice').value = localStorage.getItem('settings_default_price') || '4990';
        }
        return;
    }
    
    updateUI();
    if (path.includes('dashboard.html')) initDashboard();
    if (path.includes('course.html')) {
        if (DB.videos.length > 0) loadLesson(0);
        updateDownloadButton();
    }
});

// ========================================
// ========== КЛАВИАТУРА ==========
// ========================================
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(el => el.classList.remove('active'));
    }
    if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        togglePlay();
    }
    if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
    }
});