import {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
  NodeOperationError,
} from "n8n-workflow";

// Import thư viện lunar-date
const { SolarDate, LunarDate } = require("@nghiavuive/lunar_date_vi");

export class LunarCalendarVi implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Lunar Calendar VI",
    name: "lunarCalendarVi",
    icon: "file:lunarCalendar.svg",
    group: ["transform"],
    version: 1,
    description: "Chuyển đổi giữa âm lịch và dương lịch Việt Nam",
    defaults: {
      name: "Lunar Calendar VI",
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    properties: [
      {
        displayName: "Thao tác",
        name: "operation",
        type: "options",
        noDataExpression: true,
        options: [
          {
            name: "Dương lịch sang Âm lịch",
            value: "solarToLunar",
          },
          {
            name: "Âm lịch sang Dương lịch",
            value: "lunarToSolar",
          },
        ],
        default: "solarToLunar",
      },
      {
        displayName: "Nguồn dữ liệu",
        name: "dataSource",
        type: "options",
        options: [
          {
            name: "Ngày hiện tại",
            value: "current",
          },
          {
            name: "Ngày cụ thể",
            value: "specific",
          },
        ],
        default: "current",
        displayOptions: {
          show: {
            operation: ["solarToLunar"],
          },
        },
      },
      {
        displayName: "Ngày",
        name: "day",
        type: "number",
        default: 1,
        displayOptions: {
          show: {
            operation: ["solarToLunar", "lunarToSolar"],
            dataSource: ["specific"],
          },
        },
      },
      {
        displayName: "Tháng",
        name: "month",
        type: "number",
        default: 1,
        displayOptions: {
          show: {
            operation: ["solarToLunar", "lunarToSolar"],
            dataSource: ["specific"],
          },
        },
      },
      {
        displayName: "Năm",
        name: "year",
        type: "number",
        default: 2024,
        displayOptions: {
          show: {
            operation: ["solarToLunar", "lunarToSolar"],
            dataSource: ["specific"],
          },
        },
      },
      {
        displayName: "Ngày âm lịch",
        name: "lunarDay",
        type: "number",
        default: 1,
        displayOptions: {
          show: {
            operation: ["lunarToSolar"],
          },
        },
      },
      {
        displayName: "Tháng âm lịch",
        name: "lunarMonth",
        type: "number",
        default: 1,
        displayOptions: {
          show: {
            operation: ["lunarToSolar"],
          },
        },
      },
      {
        displayName: "Năm âm lịch",
        name: "lunarYear",
        type: "number",
        default: 2024,
        displayOptions: {
          show: {
            operation: ["lunarToSolar"],
          },
        },
      },
      {
        displayName: "Tháng nhuận",
        name: "leapMonth",
        type: "boolean",
        default: false,
        displayOptions: {
          show: {
            operation: ["lunarToSolar"],
          },
        },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter("operation", i) as string;
        let result: IDataObject = {};

        if (operation === "solarToLunar") {
          const dataSource = this.getNodeParameter("dataSource", i) as string;
          let solarDate: any;

          if (dataSource === "current") {
            solarDate = new SolarDate(new Date());
          } else {
            const day = this.getNodeParameter("day", i) as number;
            const month = this.getNodeParameter("month", i) as number;
            const year = this.getNodeParameter("year", i) as number;
            solarDate = new SolarDate(new Date(year, month - 1, day));
          }

          const lunarDate = solarDate.toLunarDate();
          const solarInfo = solarDate.get();
          const lunarInfo = lunarDate.get();

          result = {
            solar: {
              day: solarInfo.day,
              month: solarInfo.month,
              year: solarInfo.year,
              leap_year: solarInfo.leap_year,
            },
            lunar: {
              day: lunarInfo.day,
              month: lunarInfo.month,
              year: lunarInfo.year,
              leap_year: lunarInfo.leap_year,
              leap_month: lunarInfo.leap_month,
              year_name: lunarDate.getYearName?.() || "",
              month_name: lunarDate.getMonthName?.() || "",
              day_name: lunarDate.getDayName?.() || "",
            },
            julian: lunarInfo.julian,
          };
        } else if (operation === "lunarToSolar") {
          const day = this.getNodeParameter("lunarDay", i) as number;
          const month = this.getNodeParameter("lunarMonth", i) as number;
          const year = this.getNodeParameter("lunarYear", i) as number;
          const leapMonth = this.getNodeParameter("leapMonth", i) as boolean;

          const lunarDate = new LunarDate({
            day,
            month,
            year,
            leap_month: leapMonth,
          });

          lunarDate.init();
          const solarDate = lunarDate.toSolarDate();
          const solarInfo = solarDate.get();
          const lunarInfo = lunarDate.get();

          result = {
            lunar: {
              day: lunarInfo.day,
              month: lunarInfo.month,
              year: lunarInfo.year,
              leap_year: lunarInfo.leap_year,
              leap_month: lunarInfo.leap_month,
              year_name: lunarDate.getYearName?.() || "",
              month_name: lunarDate.getMonthName?.() || "",
              day_name: lunarDate.getDayName?.() || "",
            },
            solar: {
              day: solarInfo.day,
              month: solarInfo.month,
              year: solarInfo.year,
              leap_year: solarInfo.leap_year,
              date: new Date(
                solarInfo.year,
                solarInfo.month - 1,
                solarInfo.day
              ),
            },
            julian: lunarInfo.julian,
          };
        }

        returnData.push({
          json: result,
          pairedItem: i,
        });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: (error as Error).message,
            },
            pairedItem: i,
          });
        } else {
          throw new NodeOperationError(this.getNode(), error as Error, {
            itemIndex: i,
          });
        }
      }
    }

    return this.prepareOutputData(returnData);
  }
}
