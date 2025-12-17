class KnittingApp {
    constructor() {
        this.projects = [];
        this.editingProjectId = null;
        this.currentMainImage = null;
        this.currentYarnImage = null;
        this.currentMainImageFile = null;
        this.currentYarnImageFile = null;
        this.initializeElements();
        this.attachEventListeners();
        this.setupFirebaseListeners();
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

    // Firebaseリアルタイムリスナーの設定
    setupFirebaseListeners() {
        const projectsRef = database.ref('projects');

        projectsRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // オブジェクトを配列に変換し、作成日時順にソート
                this.projects = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            } else {
                this.projects = [];
            }
            this.render();
        }, (error) => {
            console.error('データの読み込みに失敗しました:', error);
            this.showMessage('データの読み込みに失敗しました', 'error');
        });
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
            this.currentMainImage = null;
            this.currentYarnImage = null;
            this.currentMainImageFile = null;
            this.currentYarnImageFile = null;
            this.mainImagePreview.innerHTML = '';
            this.yarnImagePreview.innerHTML = '';
        }
        this.projectModal.classList.add('active');
    }

    closeModal() {
        this.projectModal.classList.remove('active');
        this.projectForm.reset();
        this.editingProjectId = null;
        this.currentMainImage = null;
        this.currentYarnImage = null;
        this.currentMainImageFile = null;
        this.currentYarnImageFile = null;
        this.mainImagePreview.innerHTML = '';
        this.yarnImagePreview.innerHTML = '';
        this.mainImageCameraInput.value = '';
        this.mainImageGalleryInput.value = '';
        this.yarnImageCameraInput.value = '';
        this.yarnImageGalleryInput.value = '';
    }

    async fillForm(project) {
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectType').value = project.type;
        document.getElementById('needleSize').value = project.needleSize || '';
        document.getElementById('yarnName').value = project.yarnName || '';
        document.getElementById('yarnColor').value = project.yarnColor || '';
        document.getElementById('notes').value = project.notes || '';
        document.getElementById('youtubeUrl').value = project.youtubeUrl || '';

        // 画像の復元（URLから）
        if (project.mainImageUrl) {
            this.currentMainImage = project.mainImageUrl;
            this.showImagePreview(this.mainImagePreview, project.mainImageUrl, 'main');
        }
        if (project.yarnImageUrl) {
            this.currentYarnImage = project.yarnImageUrl;
            this.showImagePreview(this.yarnImagePreview, project.yarnImageUrl, 'yarn');
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const submitBtn = this.projectForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '保存中...';

        try {
            const projectId = this.editingProjectId || database.ref('projects').push().key;

            // 画像のアップロード
            let mainImageUrl = this.currentMainImage; // 既存のURLまたはnull
            let yarnImageUrl = this.currentYarnImage; // 既存のURLまたはnull

            // 新しいメイン画像がある場合
            if (this.currentMainImageFile) {
                this.showMessage('メイン画像をアップロード中...', 'info');
                mainImageUrl = await this.uploadImage(this.currentMainImageFile, projectId, 'main');
            }

            // 新しい毛糸画像がある場合
            if (this.currentYarnImageFile) {
                this.showMessage('毛糸画像をアップロード中...', 'info');
                yarnImageUrl = await this.uploadImage(this.currentYarnImageFile, projectId, 'yarn');
            }

            const projectData = {
                name: document.getElementById('projectName').value.trim(),
                type: document.getElementById('projectType').value,
                needleSize: document.getElementById('needleSize').value.trim(),
                yarnName: document.getElementById('yarnName').value.trim(),
                yarnColor: document.getElementById('yarnColor').value.trim(),
                notes: document.getElementById('notes').value.trim(),
                youtubeUrl: document.getElementById('youtubeUrl').value.trim(),
                mainImageUrl: mainImageUrl || null,
                yarnImageUrl: yarnImageUrl || null,
                updatedAt: new Date().toISOString()
            };

            // 新規作成の場合のみcreatedAtを設定
            if (!this.editingProjectId) {
                projectData.createdAt = new Date().toISOString();
            }

            // Firebaseに保存
            await database.ref(`projects/${projectId}`).set(projectData);

            this.showMessage('保存しました！', 'success');
            this.closeModal();
        } catch (error) {
            console.error('保存に失敗しました:', error);
            this.showMessage('保存に失敗しました: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '保存';
        }
    }

    // Firebase Storageに画像をアップロード
    async uploadImage(file, projectId, imageType) {
        try {
            // 画像を圧縮
            const compressedBlob = await this.compressImage(file);

            // Storageのパス
            const storagePath = `projects/${projectId}/${imageType}.jpg`;
            const storageRef = storage.ref(storagePath);

            // アップロード
            const snapshot = await storageRef.put(compressedBlob, {
                contentType: 'image/jpeg'
            });

            // ダウンロードURLを取得
            const downloadURL = await snapshot.ref.getDownloadURL();
            return downloadURL;
        } catch (error) {
            console.error('画像のアップロードに失敗しました:', error);
            throw new Error('画像のアップロードに失敗しました');
        }
    }

    // 画像を圧縮してBlobに変換
    async compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
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

                    // BlobとしてJPEG出力
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('画像の変換に失敗しました'));
                        }
                    }, 'image/jpeg', quality);
                };
                img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
            reader.readAsDataURL(file);
        });
    }

    async deleteProject(id) {
        if (!confirm('本当にこのプロジェクトを削除しますか？')) {
            return;
        }

        try {
            // プロジェクトデータを取得
            const snapshot = await database.ref(`projects/${id}`).once('value');
            const project = snapshot.val();

            if (!project) {
                throw new Error('プロジェクトが見つかりません');
            }

            // Storageから画像を削除
            const deletePromises = [];

            if (project.mainImageUrl) {
                const mainImageRef = storage.refFromURL(project.mainImageUrl);
                deletePromises.push(mainImageRef.delete().catch(err => {
                    console.warn('メイン画像の削除に失敗しました:', err);
                }));
            }

            if (project.yarnImageUrl) {
                const yarnImageRef = storage.refFromURL(project.yarnImageUrl);
                deletePromises.push(yarnImageRef.delete().catch(err => {
                    console.warn('毛糸画像の削除に失敗しました:', err);
                }));
            }

            await Promise.all(deletePromises);

            // Databaseから削除
            await database.ref(`projects/${id}`).remove();

            this.showMessage('削除しました', 'success');
        } catch (error) {
            console.error('削除に失敗しました:', error);
            this.showMessage('削除に失敗しました: ' + error.message, 'error');
        }
    }

    getTypeLabel(type) {
        return type === 'crochet' ? 'かぎ針編み' : '棒編み';
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
            // プレビュー用にBase64変換
            const base64Image = await this.fileToBase64(file);

            // プレビュー表示
            if (type === 'main') {
                this.currentMainImageFile = file; // アップロード用にファイルを保持
                this.currentMainImage = null; // 既存のURLをクリア
                this.showImagePreview(this.mainImagePreview, base64Image, type);
            } else if (type === 'yarn') {
                this.currentYarnImageFile = file; // アップロード用にファイルを保持
                this.currentYarnImage = null; // 既存のURLをクリア
                this.showImagePreview(this.yarnImagePreview, base64Image, type);
            }
        } catch (error) {
            console.error('画像の処理に失敗しました:', error);
            alert('画像の処理に失敗しました');
        }
    }

    // ファイルをBase64に変換（プレビュー用）
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 画像プレビュー表示
    showImagePreview(container, imageSource, type) {
        container.innerHTML = `
            <div class="preview-wrapper">
                <img src="${imageSource}" alt="プレビュー">
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
            this.currentMainImageFile = null;
            this.mainImagePreview.innerHTML = '';
            this.mainImageCameraInput.value = '';
            this.mainImageGalleryInput.value = '';
        } else if (type === 'yarn') {
            this.currentYarnImage = null;
            this.currentYarnImageFile = null;
            this.yarnImagePreview.innerHTML = '';
            this.yarnImageCameraInput.value = '';
            this.yarnImageGalleryInput.value = '';
        }
    }

    // メッセージ表示
    showMessage(message, type = 'info') {
        // 既存のメッセージを削除
        const existingMessage = document.querySelector('.toast-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // メッセージ要素を作成
        const messageEl = document.createElement('div');
        messageEl.className = `toast-message toast-${type}`;
        messageEl.textContent = message;
        document.body.appendChild(messageEl);

        // アニメーション用に少し遅延
        setTimeout(() => messageEl.classList.add('show'), 10);

        // 3秒後に削除（エラーの場合は5秒）
        const duration = type === 'error' ? 5000 : 3000;
        setTimeout(() => {
            messageEl.classList.remove('show');
            setTimeout(() => messageEl.remove(), 300);
        }, duration);
    }

    createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'project-card';

        const typeLabel = this.getTypeLabel(project.type);

        // メイン画像またはデフォルトアイコン
        let imageHtml = '';
        if (project.mainImageUrl) {
            imageHtml = `<div class="card-image"><img src="${project.mainImageUrl}" alt="${project.name}"></div>`;
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
