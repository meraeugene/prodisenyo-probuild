import styles from '@/components/workspace/workspace.module.css';
import type {MaterialRequestRecord} from '../types';
import {priorityBadgeClass,formatDate} from '../utils/materialRequestPresentation';
export default function MaterialRequestQueue({sortedRequests}:{sortedRequests:MaterialRequestRecord[]}) {
return <section className={styles.panel}><div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>Recent material requests</h2></div><div className="p-5">          {sortedRequests.length === 0 ? (
            <div className="mt-4 rounded-none border border-dashed border-apple-mist px-4 py-6 text-sm text-apple-steel sm:rounded-[7px]">
              No requests submitted yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {sortedRequests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-none border border-apple-mist bg-[rgb(var(--apple-snow))] p-4 sm:rounded-[7px]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-apple-steel">
                        {request.projectName}
                      </p>
                      <h3 className="mt-2 text-base font-semibold text-apple-charcoal">
                        {request.materialName}
                      </h3>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${priorityBadgeClass(request.priority)}`}
                    >
                      {request.priority}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-apple-smoke md:grid-cols-2">
                    <p>
                      Quantity:{" "}
                      <span className="font-semibold text-apple-charcoal">
                        {request.quantity}
                      </span>{" "}
                      {request.unit}
                    </p>
                    <p>
                      Needed by:{" "}
                      <span className="font-semibold text-apple-charcoal">
                        {formatDate(request.neededBy)}
                      </span>
                    </p>
                    <p>
                      Site:{" "}
                      <span className="font-semibold text-apple-charcoal">
                        {request.site ?? "-"}
                      </span>
                    </p>
                    <p>
                      Requested:{" "}
                      <span className="font-semibold text-apple-charcoal">
                        {formatDate(request.createdAt)}
                      </span>
                    </p>
                  </div>

                  {request.notes ? (
                    <p className="mt-3 rounded-[7px] border border-apple-mist bg-white px-3 py-2 text-sm text-apple-steel">
                      {request.notes}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}</div></section>;
}
