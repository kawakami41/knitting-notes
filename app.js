class KnittingApp {
    constructor() {
        this.projects = this.loadProjects();
        this.editingProjectId = null;
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
    }

    fillForm(project) {
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectType').value = project.type;
        document.getElementById('needleSize').value = project.needleSize || '';
        document.getElementById('yarnName').value = project.yarnName || '';
        document.getElementById('yarnColor').value = project.yarnColor || '';
        document.getElementById('notes').value = project.notes || '';
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

    createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'project-card';

        const typeLabel = this.getTypeLabel(project.type);

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

        card.innerHTML = `
            <h3>${project.name}</h3>
            <span class="project-type">${typeLabel}</span>
            <div class="project-info">
                ${infoHtml}
            </div>
            <div class="project-actions">
                <button class="btn-edit" data-id="${project.id}">編集</button>
                <button class="btn-delete" data-id="${project.id}">削除</button>
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
