class KnittingApp {
    constructor() {
        this.projects = this.loadProjects();
        this.editingProjectId = null;
        this.currentMainImage = null;
        this.currentYarnImage = null;
        this.initializeElements();
        this.attachEventListeners();
        this.render();
    }

    initializeElements() {
        this.addProjectBtn = document.getElementById('addProjectBtn');
        this.projectModal = document.getElementById('projectModal');
        this.closeModalBtn = document.getElementById('closeModal');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.projectForm = document.getElementById('projectForm');
        this.projectsList = document.getElementById('projectsList');
        this.emptyState = document.getElementById('emptyState');
        this.modalTitle = document.getElementById('modalTitle');

        // 画像関連の要素
        this.mainImageCameraInput = document.getElementById('mainImageCamera');
        this.mainImageGalleryInput = document.getElementById('mainImageGallery');
        this.mainImageCameraBtn = document.getElementById('mainImageCameraBtn');
        this.mainImageGalleryBtn = document.getElementById('mainImageGalleryBtn');
        this.mainImagePreview = document.getElementById('mainImagePreview');

        this.yarnImageCameraInput = document.getElementById('yarnImageCamera');
        this.yarnImageGalleryInput = document.getElementById('yarnImageGallery');
        this.yarnImageCameraBtn = document.getElementById('yarnImageCameraBtn');
        this.yarnImageGalleryBtn = document.getElementById('yarnImageGalleryBtn');
        this.yarnImagePreview = document.getElementById('yarnImagePreview');
    }

    attachEventListeners() {
        this.addProjectBtn.addEventListener('click', () => this.openModal());
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.projectForm.addEventListener('submit', (e) => this.handleSubmit(e));

        this.projectModal.addEventListener('click', (e) => {
            if (e.target === this.projectModal) {
                this.closeModal();
            }
        });

        // 画像アップロードのイベントリスナー
        this.mainImageCameraBtn.addEventListener('click', () => this.mainImageCameraInput.click());
        this.mainImageGalleryBtn.addEventListener('click', () => this.mainImageGalleryInput.click());
        this.mainImageCameraInput.addEventListener('change', (e) => this.handleImageSelect(e, 'main'));
        this.mainImageGalleryInput.addEventListener('change', (e) => this.handleImageSelect(e, 'main'));

        this.yarnImageCameraBtn.addEventListener('click', () => this.yarnImageCameraInput.click());
        this.yarnImageGalleryBtn.addEventListener('click', () => this.yarnImageGalleryInput.click());
        this.yarnImageCameraInput.addEventListener('change', (e) => this.handleImageSelect(e, 'yarn'));
        this.yarnImageGalleryInput.addEventListener('change', (e) => this.handleImageSelect(e, 'yarn'));
    }

    loadProjects() {
        const stored = localStorage.getItem('knittingProjects');
        return stored ? JSON.parse(stored) : [];
    }

    saveProjects() {
        localStorage.setItem('knittingProjects', JSON.stringify(this.projects));
    }

    openModal(project = null) {
        if (project) {
            this.editingProjectId = project.id;
            this.modalTitle.textContent = 'プロジェクト編集';
            this.fillForm(project);
        } else {
            this.editingProjectId = null;
            this.modalTitle.textContent = '新規プロジェクト';
            this.projectForm.reset();
        }
        this.projectModal.classList.add('active');
    }

    closeModal() {
        this.projectModal.classList.remove('active');
        this.projectForm.reset();
        this.editingProjectId = null;
        this.currentMainImage = null;
        this.currentYarnImage = null;
        this.mainImagePreview.innerHTML = '';
        this.yarnImagePreview.innerHTML = '';
        this.mainImageCameraInput.value = '';
        this.mainImageGalleryInput.value = '';
        this.yarnImageCameraInput.value = '';
        this.yarnImageGalleryInput.value = '';
    }

    fillForm(project) {
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectType').value = project.type;
        document.getElementById('needleSize').value = project.needleSize || '';
        document.getElementById('yarnName').value = project.yarnName || '';
        document.getElementById('yarnColor').value = project.yarnColor || '';
        document.getElementById('notes').value = project.notes || '';
        document.getElementById('youtubeUrl').value = project.youtubeUrl || '';

        // 画像の復元
        if (project.mainImage) {
            this.currentMainImage = project.mainImage;
            this.showImagePreview(this.mainImagePreview, project.mainImage, 'main');
        }
        if (project.yarnImage) {
            this.currentYarnImage = project.yarnImage;
            this.showImagePreview(this.yarnImagePreview, project.yarnImage, 'yarn');
        }
    }

    handleSubmit(e) {
        e.preventDefault();

        const formData = {
            id: this.editingProjectId || Date.now(),
            name: document.getElementById('projectName').value.trim(),
            type: document.getElementById('projectType').value,
            needleSize: document.getElementById('needleSize').value.trim(),
            yarnName: document.getElementById('yarnName').value.trim(),
            yarnColor: document.getElementById('yarnColor').value.trim(),
            notes: document.getElementById('notes').value.trim(),
            youtubeUrl: document.getElementById('youtubeUrl').value.trim(),
            mainImage: this.currentMainImage || null,
            yarnImage: this.currentYarnImage || null,
            createdAt: this.editingProjectId
                ? this.projects.find(p => p.id === this.editingProjectId).createdAt
                : new Date().toISOString()
        };

        if (this.editingProjectId) {
            const index = this.projects.findIndex(p => p.id === this.editingProjectId);
            this.projects[index] = formData;
        } else {
            this.projects.unshift(formData);
        }

        this.saveProjects();
        this.closeModal();
        this.render();
    }

    deleteProject(id) {
        if (confirm('本当にこのプロジェクトを削除しますか？')) {
            this.projects = this.projects.filter(p => p.id !== id);
            this.saveProjects();
            this.render();
        }
    }

    getTypeLabel(type) {
        return type === 'crochet' ? 'かぎ針編み' : '棒編み';
    }

    // 画像をリサイズしてBase64に変換
    async resizeAndConvertImage(file, maxWidth = 800, maxHeight = 800) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // アスペクト比を保ちながらリサイズ
                    if (width > height) {
                        if (width > maxWidth) {
                            height = height * (maxWidth / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = width * (maxHeight / height);
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // JPEGで圧縮（品質0.7）
                    const base64 = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(base64);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 画像選択時の処理
    async handleImageSelect(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        // 画像ファイルかチェック
        if (!file.type.startsWith('image/')) {
            alert('画像ファイルを選択してください');
            return;
        }

        try {
            // リサイズして変換
            const base64Image = await this.resizeAndConvertImage(file);

            // プレビュー表示
            if (type === 'main') {
                this.currentMainImage = base64Image;
                this.showImagePreview(this.mainImagePreview, base64Image, type);
            } else if (type === 'yarn') {
                this.currentYarnImage = base64Image;
                this.showImagePreview(this.yarnImagePreview, base64Image, type);
            }
        } catch (error) {
            console.error('画像の処理に失敗しました:', error);
            alert('画像の処理に失敗しました');
        }
    }

    // 画像プレビュー表示
    showImagePreview(container, base64Image, type) {
        container.innerHTML = `
            <div class="preview-wrapper">
                <img src="${base64Image}" alt="プレビュー">
                <button type="button" class="btn-remove-image" data-type="${type}">×</button>
            </div>
        `;

        // 削除ボタンのイベントリスナー
        const removeBtn = container.querySelector('.btn-remove-image');
        removeBtn.addEventListener('click', () => this.removeImage(type));
    }

    // 画像削除
    removeImage(type) {
        if (type === 'main') {
            this.currentMainImage = null;
            this.mainImagePreview.innerHTML = '';
            this.mainImageCameraInput.value = '';
            this.mainImageGalleryInput.value = '';
        } else if (type === 'yarn') {
            this.currentYarnImage = null;
            this.yarnImagePreview.innerHTML = '';
            this.yarnImageCameraInput.value = '';
            this.yarnImageGalleryInput.value = '';
        }
    }

    createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'project-card';

        const typeLabel = this.getTypeLabel(project.type);

        // メイン画像またはデフォルトアイコン
        let imageHtml = '';
        if (project.mainImage) {
            imageHtml = `<div class="card-image"><img src="${project.mainImage}" alt="${project.name}"></div>`;
        } else {
            imageHtml = `<div class="card-image-placeholder"><span class="icon">🧶</span></div>`;
        }

        let infoHtml = '';
        if (project.needleSize) {
            infoHtml += `<p><strong>針:</strong> ${project.needleSize}</p>`;
        }
        if (project.yarnName) {
            infoHtml += `<p><strong>毛糸:</strong> ${project.yarnName}`;
            if (project.yarnColor) {
                infoHtml += ` (${project.yarnColor})`;
            }
            infoHtml += `</p>`;
        } else if (project.yarnColor) {
            infoHtml += `<p><strong>色:</strong> ${project.yarnColor}</p>`;
        }
        if (project.notes) {
            infoHtml += `<p><strong>メモ:</strong> ${project.notes}</p>`;
        }
        if (project.youtubeUrl) {
            infoHtml += `<p><strong>📺 参考動画:</strong> <a href="${project.youtubeUrl}" target="_blank" rel="noopener noreferrer" class="youtube-link">YouTubeで見る</a></p>`;
        }

        card.innerHTML = `
            ${imageHtml}
            <div class="card-content">
                <h3>${project.name}</h3>
                <span class="project-type">${typeLabel}</span>
                <div class="project-info">
                    ${infoHtml}
                </div>
                <div class="project-actions">
                    <button class="btn-edit" data-id="${project.id}">編集</button>
                    <button class="btn-delete" data-id="${project.id}">削除</button>
                </div>
            </div>
        `;

        card.querySelector('.btn-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            this.openModal(project);
        });

        card.querySelector('.btn-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteProject(project.id);
        });

        return card;
    }

    render() {
        this.projectsList.innerHTML = '';

        if (this.projects.length === 0) {
            this.emptyState.style.display = 'block';
        } else {
            this.emptyState.style.display = 'none';
            this.projects.forEach(project => {
                const card = this.createProjectCard(project);
                this.projectsList.appendChild(card);
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new KnittingApp();
});
