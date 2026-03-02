/**
 * 깃허브 포트폴리오 메인 스크립트
 * API 연동, 데이터 처리 및 DOM 렌더링 담당
 */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// 앱 초기화 함수
async function initApp() {
    const username = CONFIG.GITHUB_USERNAME;

    try {
        if (!username) {
            throw new Error("config.js 파일에 깃허브 사용자 이름(GITHUB_USERNAME)이 설정되지 않았습니다.");
        }

        // 유저 정보와 리포지토리 목록을 병렬로 가져옵니다.
        const [userData, reposData] = await Promise.all([
            fetchGithubUser(username),
            fetchGithubRepos(username)
        ]);

        renderProfile(userData);
        renderRepos(reposData);

    } catch (error) {
        // 전역 에러 처리
        showError('profile-error', '프로필 정보를 불러오는 데 실패했습니다. 네트워크 상태나 API 제한을 확인해주세요.');
        showError('repos-error', '리포지토리 목록을 불러오는 데 실패했습니다.');

        // 스켈레톤 UI 제거
        document.getElementById('profile-container').innerHTML = '';
        document.getElementById('repos-container').innerHTML = '';
    }
}

// 깃허브 유저 정보 API 호출
async function fetchGithubUser(username) {
    const response = await fetch(`${CONFIG.API_BASE_URL}/${username}`);
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`'${username}' 사용자를 찾을 수 없습니다.`);
        } else if (response.status === 403) {
            throw new Error('깃허브 API 호출 횟수 제한(Rate Limit)을 초과했습니다.');
        }
        throw new Error(`사용자 정보 요청 실패: 상태 코드 ${response.status}`);
    }
    return response.json();
}

// 깃허브 리포지토리 목록 API 호출
async function fetchGithubRepos(username) {
    // 최근 업데이트된 순서대로 정렬하여 가져오기
    const response = await fetch(`${CONFIG.API_BASE_URL}/${username}/repos?sort=updated&per_page=30`);
    if (!response.ok) {
        throw new Error(`리포지토리 정보 요청 실패: 상태 코드 ${response.status}`);
    }
    return response.json();
}

// 프로필 UI 렌더링
function renderProfile(user) {
    const profileContainer = document.getElementById('profile-container');

    // 이력/자기소개가 없으면 기본 메시지 사용
    const bioText = user.bio || '등록된 자기소개가 없습니다.';

    const html = `
        <img src="${user.avatar_url}" alt="${user.login}의 프로필 이미지" class="profile-avatar">
        <div class="profile-text">
            <h1 class="profile-name">${user.name || user.login}</h1>
            <p class="profile-bio">${bioText}</p>
            <div class="profile-links">
                <a href="${user.html_url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                    GitHub 방문하기
                </a>
                ${user.blog ? `<a href="${user.blog.startsWith('http') ? user.blog : 'https://' + user.blog}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">블로그/웹사이트</a>` : ''}
            </div>
        </div>
    `;

    profileContainer.innerHTML = html;
}

// 리포지토리 목록 UI 렌더링
function renderRepos(repos) {
    const reposContainer = document.getElementById('repos-container');
    const repoCountBadge = document.getElementById('repo-count');

    // 리포지토리 개수 갱신
    repoCountBadge.textContent = repos.length;

    // 퍼블릭 리포지토리가 없는 경우
    if (repos.length === 0) {
        reposContainer.innerHTML = '<p class="empty-state" style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 3rem;">공개된 리포지토리가 없습니다.</p>';
        return;
    }

    // 포크(Fork)된 레포지토리는 제외할지 말지 결정 가능. 여기서는 모두 표시.
    let html = '';

    repos.forEach(repo => {
        // 언어 색상 매핑 (간단한 예시)
        const langColor = getLanguageColor(repo.language);
        const description = repo.description || '설명이 제공되지 않은 리포지토리입니다.';
        const updatedAt = new Date(repo.updated_at).toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        html += `
            <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="repo-card glass-card">
                <h3 class="repo-name">
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path fill-rule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.249.249 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"></path></svg>
                    ${repo.name}
                </h3>
                <p class="repo-desc">${description}</p>
                <div class="repo-meta">
                    ${repo.language ? `
                        <span class="meta-item">
                            <span class="lang-dot" style="background-color: ${langColor};"></span>
                            ${repo.language}
                        </span>
                    ` : ''}
                    <span class="meta-item">
                        <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z"></path></svg>
                        ${repo.stargazers_count}
                    </span>
                    <span class="meta-item" style="margin-left: auto;">
                        업데이트: ${updatedAt}
                    </span>
                </div>
            </a>
        `;
    });

    reposContainer.innerHTML = html;
}

// 에러 메시지 UI 렌더링
function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

// 프로그래밍 언어별 색상 매핑 함수
function getLanguageColor(language) {
    const colors = {
        'JavaScript': '#f1e05a',
        'TypeScript': '#3178c6',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'Python': '#3572A5',
        'Java': '#b07219',
        'C++': '#f34b7d',
        'C#': '#178600',
        'PHP': '#4F5D95',
        'Ruby': '#701516',
        'Go': '#00ADD8',
        'Rust': '#dea584',
        'Vue': '#41b883',
        'Svelte': '#ff3e00'
    };

    return colors[language] || '#8b949e'; // 매핑되지 않은 언어는 기본 회색
}
