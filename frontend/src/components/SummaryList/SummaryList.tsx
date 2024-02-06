import { useOdeClient } from "@edifice-ui/react";

import { dayjs } from "~/utils/dayjs";

// TODO Move to edifice-ui (don't forget css) css
export type SummaryListProps = {
  list: SummaryListObject[];
};

export type SummaryListObject = {
  id: string;
  title: string;
  date: string;
};

export const SummaryList = ({ list }: SummaryListProps) => {
  const { currentLanguage } = useOdeClient();
  const displayDate = (date: string) => {
    return dayjs(date)
      .locale(currentLanguage as string)
      .format("D MMM YYYY");
  };

  return (
    <div className="pt-8">
      {list.map((item /*, index*/) => (
        <div className="pb-8 d-flex summary-list-item" key={item.id}>
          <div className="summary-list-item-symbole text-primary">
            <div className="summary-list-item-symbole-circle"></div>
          </div>
          <div className="flex-fill">
            <div>{item.title}</div>
            <em className="small text-gray-700">
              {item.date && displayDate(item.date)}
            </em>
          </div>
        </div>
      ))}
    </div>
  );
};
