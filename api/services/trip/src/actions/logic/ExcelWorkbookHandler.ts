import { Workbook } from 'exceljs';
import os from 'os';
import path from 'path';
import { v4 } from 'uuid';

// TODO Should be integration test
export class ExcelWorkbookHandler {

  static readonly template_location: string = __dirname+'/../../fundcalls_template.xlsx';

  async loadWorkbookTemplate(): Promise<Workbook> {
    const wb = new Workbook();
    return wb.xlsx.readFile(ExcelWorkbookHandler.template_location);
  }

  async writeWorkbookToTempFile(workbook: Workbook): Promise<string> {
    const filename = path.join(os.tmpdir(), `appel-${v4()}`) + '.xlsx';
    await workbook.xlsx.writeFile(filename);
    return filename;
  }

}