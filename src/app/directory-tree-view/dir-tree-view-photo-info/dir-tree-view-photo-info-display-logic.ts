import { PhotoDataService } from '../../shared/service/photo-data.service';
import { NestedNode } from '../directory-tree-view.model';

export class DirTreeViewPhotoInfoDisplayLogic {
  constructor(private readonly photoDataService: PhotoDataService) {
  }

  public isVisible(node: NestedNode): boolean {
    const photoExists = !!this.photoDataService.getPhoto(node.path);
    return photoExists;
  }
}
