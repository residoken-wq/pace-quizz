"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSessionDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_session_dto_1 = require("./create-session.dto");
class UpdateSessionDto extends (0, mapped_types_1.PartialType)(create_session_dto_1.CreateSessionDto) {
}
exports.UpdateSessionDto = UpdateSessionDto;
//# sourceMappingURL=update-session.dto.js.map