import { PhotoDataService } from '../../shared/service/photo-data.service';
import { FlatNode } from '../directory-tree-view.model';

export class DirTreeViewPhotoInfoDisplayLogic {
  constructor(private readonly photoDataService: PhotoDataService) {
  }

  public isVisible(flatNode: FlatNode): boolean {
    const photoExists = !!this.photoDataService.getPhoto(flatNode.path);
    return photoExists;
  }
}
