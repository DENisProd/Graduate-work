import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { ResourceResponseDto } from './dto/resource-response.dto';
import { ResourceTreeNodeDto } from './dto/resource-tree-node.dto';
export declare class ResourcesController {
    private readonly resourcesService;
    constructor(resourcesService: ResourcesService);
    create(dto: CreateResourceDto): Promise<ResourceResponseDto>;
    findById(id: string): Promise<ResourceResponseDto>;
    getTree(houseId: string): Promise<ResourceTreeNodeDto[]>;
}
